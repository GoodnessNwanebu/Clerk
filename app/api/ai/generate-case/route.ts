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
import type { PrimaryContext } from '../../../../types/diagnosis';
import { createCaseSession } from '../../../../lib/session/session-manager';
import { cachePrimaryContext } from '../../../../lib/cache/primary-context-cache';

export async function POST(request: NextRequest) {
    try {
        // Get user session with proper typing
        const session = await getServerSession(auth) as { user?: { email?: string } } | null;
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized. Please sign in to continue.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { department: departmentName, difficulty = 'standard', userCountry, practiceCondition } = body;
        
        if (!departmentName) {
            return NextResponse.json({ success: false, error: 'Department name is required' }, { status: 400 });
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
        const department = await prisma.department.findFirst({
            where: { name: departmentName }
        });

        if (!department) {
            return NextResponse.json(
                { success: false, error: 'Department not found' },
                { status: 404 }
            );
        }

        const context = practiceCondition ? 'generatePracticeCase' : 'generateClinicalCase';
        
        // Get time context for the user's location
        const timeContext = getTimeContext(userCountry);
        
        // Check if this is a pediatric case
        const isPediatric = departmentName.toLowerCase().includes('pediatric') || departmentName.toLowerCase().includes('paediatric');
        
        // Check if this is a surgical department
        const isSurgical = departmentName.toLowerCase().includes('surgery') || departmentName.toLowerCase().includes('surgical');
        const isCardiothoracic = departmentName.toLowerCase().includes('cardiothoracic') || departmentName.toLowerCase().includes('cardiac');
        const isGeneralSurgery = departmentName.toLowerCase().includes('general surgery');
        
        let userMessage: string;
        
        if (practiceCondition) {
            // Practice case generation
            const locationPrompt = getLocationPrompt(userCountry);
            const difficultyPrompt = getDifficultyPrompt(difficulty);
            
            userMessage = `Generate a realistic and challenging clinical case for a medical student simulation in the '${departmentName}' department.
            
            ${locationPrompt}
            
            REQUIREMENTS:
            - The case MUST be for the condition: "${practiceCondition}"
            - The case should be solvable by a medical student
            - Balance regional authenticity with educational value
            - Create a realistic presentation of the specified condition${difficultyPrompt ? `\n\n${difficultyPrompt}` : ''}
            
            The output MUST be a single, perfectly valid JSON object with this exact structure: {"diagnosis": string, "primaryInfo": string, "openingLine": string}.

            - "diagnosis": The most likely diagnosis for the case (should match or be very close to "${practiceCondition}").
            - "primaryInfo": A detailed clinical history string, formatted with markdown headings. This history is the single source of truth for the AI patient. It MUST include all of the following sections:
                - ## BIODATA
                - ## Presenting Complaint
                - ## History of Presenting Complaint
                - ## Past Medical and Surgical History
                - ## Drug History
                - ## Family History
                - ## Social History
                - ## Review of Systems
            - "openingLine": A natural, first-person statement from the patient that initiates the consultation.`;
        } else {
            // Regular case generation
            // Randomly select a medical bucket
            const randomBucket = MEDICAL_BUCKETS[Math.floor(Math.random() * MEDICAL_BUCKETS.length)];
            
            // Get optimized prompts
            const locationPrompt = getLocationPrompt(userCountry);
            const surgicalPrompt = getSurgicalPrompt(isSurgical, isCardiothoracic, isGeneralSurgery);
            const pediatricPrompt = getPediatricPrompt(isPediatric);
            const difficultyPrompt = getDifficultyPrompt(difficulty);
            
            userMessage = generateCasePrompt(
                departmentName, 
                randomBucket, 
                timeContext.formattedContext, 
                locationPrompt, 
                surgicalPrompt, 
                pediatricPrompt, 
                isPediatric, 
                isSurgical
            ) + (difficultyPrompt ? `\n\n${difficultyPrompt}` : '');
        }

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const caseData = parseJsonResponse<Case>(response.text, context);

        // Create case in database
        const caseRecord = await prisma.case.create({
            data: {
                userId: user.id,
                departmentId: department.id,
                diagnosis: caseData.diagnosis,
                primaryInfo: caseData.primaryInfo,
                openingLine: caseData.openingLine,
                isPediatric,
                difficultyLevel: difficulty as DifficultyLevel,
                isCompleted: false,
                isVisible: true
            }
        });

        // Create primary context
        const primaryContext: PrimaryContext = {
            diagnosis: caseData.diagnosis,
            primaryInfo: caseData.primaryInfo,
            openingLine: caseData.openingLine,
            patientProfile: caseData.patientProfile,
            pediatricProfile: caseData.pediatricProfile,
            isPediatric,
            department: departmentName,
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

        // Create response with JWT cookie (primary context is secured in JWT, not exposed in response)
        const responseData = {
            success: true,
            case: {
                id: caseRecord.id,
                sessionId,
                
                department: departmentName,
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