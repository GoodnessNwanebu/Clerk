import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';
import { validateCaseSession } from '../../../../lib/session/session-manager';
import type { 
  ValidateCaseSessionRequest,
  ValidateCaseSessionResponse
} from '../../../../types/sessions';

/**
 * POST /api/sessions/validate - Validate a case session
 */
export async function POST(request: NextRequest): Promise<NextResponse<ValidateCaseSessionResponse>> {
  try {
    // Get user session with proper typing
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as ValidateCaseSessionRequest;
    
    // Validate request
    if (!body.caseId) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Missing case ID' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Find active session for this case and user
    const caseSession = await prisma.caseSession.findFirst({
      where: {
        caseId: body.caseId,
        userId: user.id,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!caseSession) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'No active session found' },
        { status: 401 }
      );
    }

    // Validate session using session manager
    const sessionValidation = await validateCaseSession({
      sessionId: caseSession.sessionId,
      userId: user.id,
      caseId: body.caseId
    });

    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { success: false, isValid: false, error: sessionValidation.error || 'Invalid session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      isValid: true,
      sessionId: caseSession.sessionId,
      expiresAt: caseSession.expiresAt
    });

  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json(
      { success: false, isValid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
