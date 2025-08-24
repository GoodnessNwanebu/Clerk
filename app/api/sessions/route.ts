import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/database/prisma';
import { createCaseSession, validateCaseSession, deactivateCaseSession, getActiveSessions } from '../../../lib/session/session-manager';
import { cachePrimaryContext } from '../../../lib/cache/primary-context-cache';
import type { 
  CreateCaseSessionRequest, 
  CreateCaseSessionResponse,
  ValidateCaseSessionRequest,
  ValidateCaseSessionResponse,
  InvalidateCaseSessionRequest,
  InvalidateCaseSessionResponse,
  GetActiveCasesRequest,
  GetActiveCasesResponse
} from '../../../types/sessions';
import type { AuthError } from '../../../types/auth';

/**
 * POST /api/sessions - Create a new case session
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateCaseSessionResponse>> {
  try {
    // Get user session with proper typing
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as CreateCaseSessionRequest;
    
    // Validate request
    if (!body.caseId || !body.primaryContext) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
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

    // Verify case exists and belongs to user
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: body.caseId,
        userId: user.id
      }
    });

    if (!caseRecord) {
      return NextResponse.json(
        { success: false, error: 'Case not found or access denied' },
        { status: 404 }
      );
    }

    // Create session using the new session manager
    const sessionResult = await createCaseSession({
      caseId: body.caseId,
      userId: user.id,
      expiresIn: body.expiresIn
    });

    // Cache the primary context
    await cachePrimaryContext(
      body.caseId,
      user.id,
      sessionResult.sessionId,
      body.primaryContext
    );

    // Update case with session ID
    await prisma.case.update({
      where: { id: body.caseId },
      data: { sessionId: sessionResult.sessionId }
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      session: {
        id: body.caseId,
        caseId: body.caseId,
        userId: user.id,
        sessionId: sessionResult.sessionId,
        expiresAt: sessionResult.expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return response;

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions - Get active cases for user
 */
export async function GET(request: NextRequest): Promise<NextResponse<GetActiveCasesResponse>> {
  try {
    // Get user session with proper typing
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, cases: [], error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, cases: [], error: 'User not found' },
        { status: 404 }
      );
    }

    // Get active sessions using the session manager
    const activeSessions = await getActiveSessions(user.id);

    const cases = activeSessions.map(session => ({
      id: session.case.id,
      sessionId: session.sessionId,
      department: { name: session.case.department.name },
      openingLine: session.case.openingLine,
      difficultyLevel: session.case.difficultyLevel,
      isPediatric: session.case.isPediatric,
      createdAt: session.case.createdAt,
      updatedAt: session.case.updatedAt
    }));

    return NextResponse.json({
      success: true,
      cases
    });

  } catch (error) {
    console.error('Get active cases error:', error);
    return NextResponse.json(
      { success: false, cases: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}
