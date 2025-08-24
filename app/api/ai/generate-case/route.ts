import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';
import { Case, DifficultyLevel } from '../../../../types';
import { getTimeContext } from '../../../../lib/shared/timeContext';
import { ai, MODEL, MEDICAL_BUCKETS, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { 
    generateCasePrompt, 
    getDifficultyPrompt, 
    getLocationPrompt, 
    getSurgicalPrompt, 
    getPediatricPrompt 
} from '../../../../lib/ai/prompts/case-generation';
import { 
    generatePracticeCasePrompt, 
    validateCustomCaseInput, 
    detectInputType 
} from '../../../../lib/ai/prompts/practice-case-generation';
import type { PrimaryContext } from '../../../../types/diagnosis';
import { createCaseSession } from '../../../../lib/session/session-manager';
import { cachePrimaryContext } from '../../../../lib/cache/primary-context-cache';

export async function POST(request: NextRequest) {
    try {
        const { department, difficulty = 'standard', userCountry, subspecialty, practiceCondition } = await request.json();
        
        console.log('📋 Case generation request:', { department, difficulty, userCountry, subspecialty, practiceCondition });
        
        if (!department) {
            return NextResponse.json({ error: 'Department is required' }, { status: 400 });
        }

        // Determine if this is a practice case
        const isPracticeCase = !!practiceCondition;

        // Get user session with proper typing
        const session = await getServerSession(auth) as { user?: { email?: string } } | null;
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Please sign in to continue.' },
                { status: 401 }
            );
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Get department from database
        const departmentRecord = await prisma.department.findFirst({
            where: { name: department }
        });

        if (!departmentRecord) {
            return NextResponse.json(
                { success: false, error: 'Department not found' },
                { status: 404 }
            );
        }

        const context = isPracticeCase ? 'generatePracticeCase' : 'generateClinicalCase';
        
        // Get time context for the user's location
        const timeContext = getTimeContext(userCountry);
        
        // Check if this is a pediatric case
        const isPediatric = departmentRecord.name.toLowerCase().includes('pediatric') || departmentRecord.name.toLowerCase().includes('paediatric');
        
        // Check if this is a surgical department
        const isSurgical = departmentRecord.name.toLowerCase().includes('surgery') || departmentRecord.name.toLowerCase().includes('surgical');
        const isCardiothoracic = departmentRecord.name.toLowerCase().includes('cardiothoracic') || departmentRecord.name.toLowerCase().includes('cardiac');
        const isGeneralSurgery = departmentRecord.name.toLowerCase().includes('general surgery');
        
        let userMessage: string;
        let randomBucket: string;
        
        if (isPracticeCase) {
            // Practice case generation
            const inputType = detectInputType(practiceCondition);
            
            // Validate custom case input
            if (inputType === 'custom') {
                const validation = validateCustomCaseInput(practiceCondition);
                if (!validation.isValid) {
                    return NextResponse.json({ 
                        error: validation.error!,
                        suggestion: validation.suggestion
                    }, { status: 400 });
                }
            }
            
            userMessage = generatePracticeCasePrompt(
                departmentRecord.name,
                practiceCondition,
                userCountry,
                difficulty
            );
            randomBucket = 'Practice Case';
        } else {
            // Regular case generation
            // Randomly select a medical bucket
            randomBucket = MEDICAL_BUCKETS[Math.floor(Math.random() * MEDICAL_BUCKETS.length)];
            
            // Get optimized prompts
            const locationPrompt = getLocationPrompt(userCountry);
            const surgicalPrompt = getSurgicalPrompt(isSurgical, isCardiothoracic, isGeneralSurgery);
            const pediatricPrompt = getPediatricPrompt(isPediatric);
            const difficultyPrompt = getDifficultyPrompt(difficulty);
            
            // Include subspecialty information if provided
            const subspecialtyContext = subspecialty ? `\n\nSUBSCRIPTY CONTEXT: This case should be specifically tailored for ${subspecialty} subspecialty within ${departmentRecord.name}. Focus on conditions and presentations commonly seen in ${subspecialty}.` : '';
            
            userMessage = generateCasePrompt(
                departmentRecord.name, 
                randomBucket, 
                timeContext.formattedContext, 
                locationPrompt, 
                surgicalPrompt, 
                pediatricPrompt, 
                isPediatric, 
                isSurgical
            ) + subspecialtyContext + (difficultyPrompt ? `\n\n${difficultyPrompt}` : '');
        }

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        console.log('🤖 AI Response:', response.text);
        
        const caseData = parseJsonResponse<Case>(response.text, context);
        
        console.log('📋 Parsed case data:', {
            diagnosis: caseData.diagnosis,
            hasPrimaryInfo: !!caseData.primaryInfo,
            hasOpeningLine: !!caseData.openingLine,
            openingLine: caseData.openingLine,
            isPediatric,
            hasPediatricProfile: !!caseData.pediatricProfile,
            hasPatientProfile: !!caseData.patientProfile,
            pediatricProfile: caseData.pediatricProfile ? {
                patientAge: caseData.pediatricProfile.patientAge,
                ageGroup: caseData.pediatricProfile.ageGroup,
                respondingParent: caseData.pediatricProfile.respondingParent,
                hasParentProfile: !!caseData.pediatricProfile.parentProfile,
                parentProfileFields: caseData.pediatricProfile.parentProfile ? Object.keys(caseData.pediatricProfile.parentProfile) : null
            } : null,
            patientProfile: caseData.patientProfile ? {
                educationLevel: caseData.patientProfile.educationLevel,
                healthLiteracy: caseData.patientProfile.healthLiteracy,
                occupation: caseData.patientProfile.occupation,
                recordKeeping: caseData.patientProfile.recordKeeping
            } : null
        });

        // Validate required fields
        if (!caseData.openingLine) {
            console.error('❌ Missing openingLine in AI response');
            console.error('🔍 Attempting to generate openingLine from diagnosis...');
            
            // Try to generate openingLine from the diagnosis
            try {
                const openingLinePrompt = `Generate a natural first-person opening statement for a patient with ${caseData.diagnosis}. 
                
                The statement should be:
                - Natural and conversational
                - In first person (patient speaking)
                - Related to the main symptoms of ${caseData.diagnosis}
                - 1-2 sentences maximum
                
                Return ONLY the opening statement, no JSON formatting.`;
                
                const openingLineResponse = await ai.generateContent({
                    model: MODEL,
                    contents: [{ text: openingLinePrompt }],
                });
                
                if (openingLineResponse.text && openingLineResponse.text.trim()) {
                    caseData.openingLine = openingLineResponse.text.trim();
                    console.log('✅ Generated openingLine:', caseData.openingLine);
                } else {
                    throw new Error('Failed to generate openingLine');
                }
            } catch (fallbackError) {
                console.error('❌ Failed to generate openingLine fallback:', fallbackError);
                throw new Error('AI response missing required openingLine field and fallback generation failed');
            }
        }

        // Create patient profile and pediatric profile if needed
        let patientProfileId: string | null = null;
        let pediatricProfileId: string | null = null;

        if (isPediatric && caseData.pediatricProfile) {
            console.log('👶 Creating pediatric profile...');
            
            // Validate pediatric profile structure
            if (!caseData.pediatricProfile.parentProfile || 
                !caseData.pediatricProfile.parentProfile.educationLevel ||
                !caseData.pediatricProfile.parentProfile.healthLiteracy ||
                !caseData.pediatricProfile.parentProfile.occupation ||
                !caseData.pediatricProfile.parentProfile.recordKeeping) {
                console.error('❌ Invalid pediatric profile structure:', caseData.pediatricProfile);
                throw new Error('AI generated incomplete pediatric profile structure');
            }
            
            // First create the parent's patient profile
            const parentProfile = await prisma.patientProfile.create({
                data: {
                    educationLevel: caseData.pediatricProfile.parentProfile.educationLevel,
                    healthLiteracy: caseData.pediatricProfile.parentProfile.healthLiteracy,
                    occupation: caseData.pediatricProfile.parentProfile.occupation,
                    recordKeeping: caseData.pediatricProfile.parentProfile.recordKeeping
                }
            });
            
            // Then create the pediatric profile
            const pediatricProfile = await prisma.pediatricProfile.create({
                data: {
                    patientAge: caseData.pediatricProfile.patientAge,
                    ageGroup: caseData.pediatricProfile.ageGroup,
                    respondingParent: caseData.pediatricProfile.respondingParent,
                    developmentalStage: caseData.pediatricProfile.developmentalStage,
                    communicationLevel: caseData.pediatricProfile.communicationLevel,
                    parentProfileId: parentProfile.id
                }
            });
            
            pediatricProfileId = pediatricProfile.id;
            console.log('✅ Pediatric profile created:', {
                patientAge: caseData.pediatricProfile.patientAge,
                ageGroup: caseData.pediatricProfile.ageGroup,
                respondingParent: caseData.pediatricProfile.respondingParent
            });
        } else if (caseData.patientProfile) {
            console.log('👤 Creating patient profile...');
            
            const patientProfile = await prisma.patientProfile.create({
                data: {
                    educationLevel: caseData.patientProfile.educationLevel,
                    healthLiteracy: caseData.patientProfile.healthLiteracy,
                    occupation: caseData.patientProfile.occupation,
                    recordKeeping: caseData.patientProfile.recordKeeping
                }
            });
            
            patientProfileId = patientProfile.id;
            console.log('✅ Patient profile created');
        }

        // Create case in database
        console.log('💾 Creating case with profile IDs:', {
            patientProfileId,
            pediatricProfileId,
            isPediatric
        });
        
        const caseRecord = await prisma.case.create({
            data: {
                userId: user.id,
                departmentId: departmentRecord.id,
                diagnosis: caseData.diagnosis,
                primaryInfo: caseData.primaryInfo,
                openingLine: caseData.openingLine,
                isPediatric,
                difficultyLevel: difficulty as DifficultyLevel,
                pathophysiologyCategory: randomBucket,
                isCompleted: false,
                isVisible: true,
                patientProfileId,
                pediatricProfileId
            }
        });
        
        console.log('✅ Case created with ID:', caseRecord.id);

        // Create primary context
        const primaryContext: PrimaryContext = {
            diagnosis: caseData.diagnosis,
            primaryInfo: caseData.primaryInfo,
            openingLine: caseData.openingLine,
            patientProfile: caseData.patientProfile,
            pediatricProfile: caseData.pediatricProfile,
            isPediatric,
            department: departmentRecord.name,
            difficultyLevel: difficulty as DifficultyLevel
        };

        console.log('🔐 Creating case session...');
        console.log('🔐 Case ID:', caseRecord.id);
        console.log('🔐 User ID:', user.id);
        console.log('🔐 Primary Context keys:', Object.keys(primaryContext));

        // Create session
        const { sessionId, expiresAt } = await createCaseSession({
            caseId: caseRecord.id,
            userId: user.id,
            expiresIn: 3600 // 1 hour
        });

        console.log('✅ Session created successfully');
        console.log('🔐 Session ID:', sessionId);
        console.log('🔐 Session expires at:', expiresAt);

        // Cache primary context
        console.log('💾 Caching primary context...');
        await cachePrimaryContext(
            caseRecord.id,
            user.id,
            sessionId,
            primaryContext
        );

        // Update case with session ID
        console.log('💾 Updating case with session ID...');
        await prisma.case.update({
            where: { id: caseRecord.id },
            data: { sessionId }
        });
        console.log('✅ Case updated with session ID');

        // Create response with session (primary context is secured in cache, not exposed in response)
        const responseData = {
            success: true,
            case: {
                id: caseRecord.id,
                sessionId,
                
                department: departmentRecord.name,
                openingLine: caseData.openingLine,
                isPediatric,
                difficultyLevel: difficulty,
                createdAt: caseRecord.createdAt
            }
        };

        const nextResponse = NextResponse.json(responseData);
        console.log('📤 Response created successfully');
        console.log('✅ Case generation completed with session ID:', sessionId);

        return nextResponse;

    } catch (error) {
        return handleApiError(error, 'generateCase');
    }
} 