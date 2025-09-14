import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';
import { Case, DifficultyLevel } from '../../../../types';
import { getTimeContext } from '../../../../lib/shared/timeContext';
import { ai, MODEL, MEDICAL_BUCKETS, getBucketForDepartment, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
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
import { isFirstTimeUser } from '../../../../lib/database/database';
import { hasSubspecialties, getParentDepartment } from '../../../../lib/services/departmentService';

interface GenerateOSCECaseRequest {
  department: string;
  difficulty?: DifficultyLevel;
  userCountry?: string;
  osceMode: 'simulation' | 'practice';
  practiceCondition?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { department, difficulty = 'standard', userCountry, osceMode, practiceCondition } = await request.json() as GenerateOSCECaseRequest;
        
        console.log('🩺 OSCE Case generation request:', { department, difficulty, userCountry, osceMode, practiceCondition });
        
        if (!department) {
            return NextResponse.json({ error: 'Department is required' }, { status: 400 });
        }

        // Determine if this is a practice case
        const isPracticeCase = osceMode === 'practice' && !!practiceCondition;

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

        // Check if this is a first-time user (no completed cases)
        const isFirstTime = await isFirstTimeUser(user.id);
        console.log('👤 User first-time status:', isFirstTime);

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

        // OSCE-specific logic: Random subspecialty selection
        let selectedSubspecialty: string | null = null;
        let randomBucket: string;

        if (hasSubspecialties(department)) {
            // Get all subspecialties for this department from the database
            const departmentWithSubspecialties = await prisma.department.findFirst({
                where: { name: department },
                include: { subspecialties: true }
            });

            if (departmentWithSubspecialties && departmentWithSubspecialties.subspecialties.length > 0) {
                // Randomly select a subspecialty with equal probability
                const subspecialties = departmentWithSubspecialties.subspecialties;
                const randomIndex = Math.floor(Math.random() * subspecialties.length);
                selectedSubspecialty = subspecialties[randomIndex].name;
                
                console.log('🎲 OSCE Random subspecialty selection:', {
                    department,
                    availableSubspecialties: subspecialties.map(s => s.name),
                    selectedSubspecialty
                });
            }
        }

        const context = isPracticeCase ? 'generateOSCEPracticeCase' : 'generateOSCEClinicalCase';
        
        // Get time context for the user's location
        const timeContext = getTimeContext(userCountry);
        
        // Check if this is a pediatric case
        const isPediatric = departmentRecord.name.toLowerCase().includes('pediatric') || departmentRecord.name.toLowerCase().includes('paediatric');
        
        // Check if this is a surgical department
        const isSurgical = departmentRecord.name.toLowerCase().includes('surgery') || departmentRecord.name.toLowerCase().includes('surgical');
        const isCardiothoracic = departmentRecord.name.toLowerCase().includes('cardiothoracic') || departmentRecord.name.toLowerCase().includes('cardiac');
        const isGeneralSurgery = departmentRecord.name.toLowerCase().includes('general surgery');
        
        let userMessage: string;
        
        if (isPracticeCase) {
            // OSCE Practice case generation
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
            
            // Get all the same customization prompts as regular cases
            const locationPrompt = getLocationPrompt(userCountry);
            const surgicalPrompt = getSurgicalPrompt(isSurgical, isCardiothoracic, isGeneralSurgery);
            const pediatricPrompt = getPediatricPrompt(isPediatric);
            const difficultyPrompt = getDifficultyPrompt(difficulty);
            
            userMessage = generatePracticeCasePrompt(
                departmentRecord.name,
                practiceCondition,
                userCountry,
                difficulty,
                timeContext.formattedContext,
                surgicalPrompt,
                pediatricPrompt,
                isPediatric,
                isSurgical
            );
            randomBucket = 'OSCE Practice Case';
        } else {
            // OSCE Regular case generation
            // Select appropriate bucket for department (specific or generic)
            randomBucket = getBucketForDepartment(departmentRecord.name);
            
            // Get optimized prompts
            const locationPrompt = getLocationPrompt(userCountry);
            const surgicalPrompt = getSurgicalPrompt(isSurgical, isCardiothoracic, isGeneralSurgery);
            const pediatricPrompt = getPediatricPrompt(isPediatric);
            const difficultyPrompt = getDifficultyPrompt(difficulty);
            
            // Include OSCE-specific context and random subspecialty information
            const osceContext = `
OSCE SPECIFIC REQUIREMENTS:
- This case is for an OSCE (Objective Structured Clinical Examination) station
- The student will have 5 minutes to take a focused history
- Generate a case that is suitable for focused history-taking within this time constraint
- The case should have clear, identifiable symptoms that a medical student can explore in 5 minutes
- Avoid overly complex multi-system presentations that would be difficult to cover in the time limit
- Focus on a single primary condition with clear diagnostic features`;

            const subspecialtyContext = selectedSubspecialty ? 
                `\n\nSUBSCRIPTY CONTEXT: This case should be specifically tailored for ${selectedSubspecialty} subspecialty within ${departmentRecord.name}. Focus on conditions and presentations commonly seen in ${selectedSubspecialty}.` : '';
            
            userMessage = generateCasePrompt(
                departmentRecord.name, 
                randomBucket, 
                timeContext.formattedContext, 
                locationPrompt, 
                surgicalPrompt, 
                pediatricPrompt, 
                isPediatric, 
                isSurgical,
                difficulty as DifficultyLevel,
                undefined, // specificPatientProfileRequest
                undefined // specificDiagnosisRequest
            ) + osceContext + subspecialtyContext;
        }

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        console.log('🤖 AI Response for OSCE case:', response.text);
        
        const caseData = parseJsonResponse<Case>(response.text, context);
        
        console.log('📋 Parsed OSCE case data:', {
            diagnosis: caseData.diagnosis,
            hasPrimaryInfo: !!caseData.primaryInfo,
            hasOpeningLine: !!caseData.openingLine,
            openingLine: caseData.openingLine,
            isPediatric,
            hasPediatricProfile: !!caseData.pediatricProfile,
            hasPatientProfile: !!caseData.patientProfile,
            selectedSubspecialty
        });

        // Validate required fields
        if (!caseData.openingLine) {
            console.error('❌ Missing openingLine in AI response');
            console.error('🔍 Attempting to generate openingLine from diagnosis...');
            
            // Try to generate openingLine from the diagnosis
            try {
                const openingLinePrompt = `Generate a natural first-person opening statement for a patient with ${caseData.diagnosis} in an OSCE setting. 
                
                The statement should be:
                - Natural and conversational
                - In first person (patient speaking)
                - Related to the main symptoms of ${caseData.diagnosis}
                - 1-2 sentences maximum
                - Suitable for a focused 5-minute history taking session
                
                Return ONLY the opening statement, no JSON formatting.`;
                
                const openingLineResponse = await ai.generateContent({
                    model: MODEL,
                    contents: [{ text: openingLinePrompt }],
                });
                
                if (openingLineResponse.text && openingLineResponse.text.trim()) {
                    caseData.openingLine = openingLineResponse.text.trim();
                    console.log('✅ Generated OSCE openingLine:', caseData.openingLine);
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
            console.log('👶 Creating pediatric profile for OSCE...');
            
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
            console.log('✅ OSCE Pediatric profile created:', {
                patientAge: caseData.pediatricProfile.patientAge,
                ageGroup: caseData.pediatricProfile.ageGroup,
                respondingParent: caseData.pediatricProfile.respondingParent
            });
        } else if (caseData.patientProfile) {
            console.log('👤 Creating patient profile for OSCE...');
            
            const patientProfile = await prisma.patientProfile.create({
                data: {
                    educationLevel: caseData.patientProfile.educationLevel,
                    healthLiteracy: caseData.patientProfile.healthLiteracy,
                    occupation: caseData.patientProfile.occupation,
                    recordKeeping: caseData.patientProfile.recordKeeping
                }
            });
            
            patientProfileId = patientProfile.id;
            console.log('✅ OSCE Patient profile created');
        }

        // Create case in database
        console.log('💾 Creating OSCE case with profile IDs:', {
            patientProfileId,
            pediatricProfileId,
            isPediatric,
            selectedSubspecialty
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
                isPractice: isPracticeCase,
                isCompleted: false,
                isVisible: true,
                patientProfileId,
                pediatricProfileId
            }
        });
        
        console.log('✅ OSCE Case created with ID:', caseRecord.id);

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

        console.log('🔐 Creating OSCE case session...');
        console.log('🔐 Case ID:', caseRecord.id);
        console.log('🔐 User ID:', user.id);
        console.log('🔐 Primary Context keys:', Object.keys(primaryContext));

        // Create session
        const { sessionId, expiresAt } = await createCaseSession({
            caseId: caseRecord.id,
            userId: user.id,
            expiresIn: 3600 // 1 hour
        });

        console.log('✅ OSCE Session created successfully');
        console.log('🔐 Session ID:', sessionId);
        console.log('🔐 Session expires at:', expiresAt);

        // Cache primary context
        console.log('💾 Caching OSCE primary context...');
        await cachePrimaryContext(
            caseRecord.id,
            user.id,
            sessionId,
            primaryContext
        );

        // Update case with session ID
        console.log('💾 Updating OSCE case with session ID...');
        await prisma.case.update({
            where: { id: caseRecord.id },
            data: { sessionId }
        });
        console.log('✅ OSCE Case updated with session ID');

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
                createdAt: caseRecord.createdAt,
                isFirstTime,
                selectedSubspecialty, // Include the randomly selected subspecialty for reference
                osceMode
            }
        };

        const nextResponse = NextResponse.json(responseData);
        console.log('📤 OSCE Response created successfully');
        console.log('✅ OSCE Case generation completed with session ID:', sessionId);

        return nextResponse;

    } catch (error) {
        return handleApiError(error, 'generateOSCECase');
    }
}
