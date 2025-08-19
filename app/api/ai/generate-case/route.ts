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
        const { department, difficulty = 'standard', userCountry, subspecialty } = await request.json();
        
        console.log('📋 Case generation request:', { department, difficulty, userCountry, subspecialty });
        
        if (!department) {
            return NextResponse.json({ error: 'Department is required' }, { status: 400 });
        }

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

        const context = 'generateClinicalCase'; // Practice case generation is removed
        
        // Get time context for the user's location
        const timeContext = getTimeContext(userCountry);
        
        // Check if this is a pediatric case
        const isPediatric = departmentRecord.name.toLowerCase().includes('pediatric') || departmentRecord.name.toLowerCase().includes('paediatric');
        
        // Check if this is a surgical department
        const isSurgical = departmentRecord.name.toLowerCase().includes('surgery') || departmentRecord.name.toLowerCase().includes('surgical');
        const isCardiothoracic = departmentRecord.name.toLowerCase().includes('cardiothoracic') || departmentRecord.name.toLowerCase().includes('cardiac');
        const isGeneralSurgery = departmentRecord.name.toLowerCase().includes('general surgery');
        
        let userMessage: string;
        
        // Regular case generation
        // Randomly select a medical bucket
        const randomBucket = MEDICAL_BUCKETS[Math.floor(Math.random() * MEDICAL_BUCKETS.length)];
        
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
            openingLine: caseData.openingLine
        });

        // Validate required fields
        if (!caseData.openingLine) {
            console.error('❌ Missing openingLine in AI response');
            throw new Error('AI response missing required openingLine field');
        }

        // Create case in database
        const caseRecord = await prisma.case.create({
            data: {
                userId: user.id,
                departmentId: departmentRecord.id,
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