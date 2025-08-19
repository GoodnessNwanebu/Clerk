import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';
import { CaseJWTManager } from '../../../../lib/jwt/case-jwt';
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

export async function POST(request: NextRequest) {
    try {
        // Get user session with proper typing
        const session = await getServerSession(auth) as { user?: { email?: string } } | null;
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { department: departmentName, difficulty = 'standard', userCountry } = body;
        
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

        const context = 'generateClinicalCase';
        
        // Get time context for the user's location
        const timeContext = getTimeContext(userCountry);
        
        // Check if this is a pediatric case
        const isPediatric = departmentName.toLowerCase().includes('pediatric') || departmentName.toLowerCase().includes('paediatric');
        
        // Check if this is a surgical department
        const isSurgical = departmentName.toLowerCase().includes('surgery') || departmentName.toLowerCase().includes('surgical');
        const isCardiothoracic = departmentName.toLowerCase().includes('cardiothoracic') || departmentName.toLowerCase().includes('cardiac');
        const isGeneralSurgery = departmentName.toLowerCase().includes('general surgery');
        
        // Randomly select a medical bucket
        const randomBucket = MEDICAL_BUCKETS[Math.floor(Math.random() * MEDICAL_BUCKETS.length)];
        
        // Get optimized prompts
        const locationPrompt = getLocationPrompt(userCountry);
        const surgicalPrompt = getSurgicalPrompt(isSurgical, isCardiothoracic, isGeneralSurgery);
        const pediatricPrompt = getPediatricPrompt(isPediatric);
        const difficultyPrompt = getDifficultyPrompt(difficulty);
        
        const userMessage = generateCasePrompt(
            departmentName, 
            randomBucket, 
            timeContext.formattedContext, 
            locationPrompt, 
            surgicalPrompt, 
            pediatricPrompt, 
            isPediatric, 
            isSurgical
        ) + (difficultyPrompt ? `\n\n${difficultyPrompt}` : '');

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

        // Create primary context for JWT
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

        // Create JWT token
        const jwtToken = CaseJWTManager.createCaseJWT({
            caseId: caseRecord.id,
            userId: user.id,
            primaryContext
        });

        // Extract session ID from JWT
        const decoded = CaseJWTManager.validateCaseJWT(jwtToken);
        if (!decoded.isValid || !decoded.decoded) {
            return NextResponse.json(
                { success: false, error: 'Failed to create session' },
                { status: 500 }
            );
        }

        const sessionId = decoded.decoded.sessionId;
        const expiresAt = CaseJWTManager.getJWTExpiration(jwtToken);

        if (!expiresAt) {
            return NextResponse.json(
                { success: false, error: 'Failed to determine session expiration' },
                { status: 500 }
            );
        }

        // Create session record in database
        const caseSession = await prisma.caseSession.create({
            data: {
                caseId: caseRecord.id,
                userId: user.id,
                sessionId,
                expiresAt,
                isActive: true
            }
        });

        // Update case with session ID
        await prisma.case.update({
            where: { id: caseRecord.id },
            data: { sessionId }
        });

        // Create response with JWT cookie
        const responseData = {
            success: true,
            case: {
                id: caseRecord.id,
                sessionId,
                department: departmentName,
                diagnosis: caseData.diagnosis,
                primaryInfo: caseData.primaryInfo,
                openingLine: caseData.openingLine,
                isPediatric,
                difficultyLevel: difficulty,
                createdAt: caseRecord.createdAt
            }
        };

        const nextResponse = NextResponse.json(responseData);

        // Set JWT cookie
        const cookieOptions = CaseJWTManager.getCookieOptions();
        nextResponse.cookies.set('case-context', jwtToken, cookieOptions);

        return nextResponse;

    } catch (error) {
        return handleApiError(error, 'generateCase');
    }
} 