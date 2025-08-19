import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { CaseJWTManager } from '../../../../lib/jwt/case-jwt';
import { prisma } from '../../../../lib/database/prisma';
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
    if (!body.sessionId || !body.caseId) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Missing required fields' },
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

    // Get JWT from cookies
    const cookies = request.headers.get('cookie') || '';
    const jwtToken = CaseJWTManager.extractJWTFromCookies(cookies);

    if (!jwtToken) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'No session token found' },
        { status: 401 }
      );
    }

    // Validate JWT
    const jwtValidation = CaseJWTManager.validateCaseJWT(jwtToken);
    if (!jwtValidation.isValid || !jwtValidation.decoded) {
      return NextResponse.json(
        { success: false, isValid: false, error: jwtValidation.error || 'Invalid session token' },
        { status: 401 }
      );
    }

    const { caseId, userId, sessionId: jwtSessionId, primaryContext } = jwtValidation.decoded;

    // Verify user owns the session
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // Verify case ID matches
    if (caseId !== body.caseId) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Case ID mismatch' },
        { status: 403 }
      );
    }

    // Verify session ID matches
    if (jwtSessionId !== body.sessionId) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Session ID mismatch' },
        { status: 403 }
      );
    }

    // Check if session exists in database and is active
    const caseSession = await prisma.caseSession.findFirst({
      where: {
        sessionId: body.sessionId,
        caseId: body.caseId,
        userId: user.id,
        isActive: true
      }
    });

    if (!caseSession) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Session not found or inactive' },
        { status: 404 }
      );
    }

    // Check if session is expired
    if (caseSession.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, isValid: false, error: 'Session has expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      isValid: true,
      session: caseSession,
      primaryContext
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { success: false, isValid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
