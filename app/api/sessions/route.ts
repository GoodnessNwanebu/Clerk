import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../lib/auth';
import { CaseJWTManager, createJWTError } from '../../../lib/jwt/case-jwt';
import { prisma } from '../../../lib/database/prisma';
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

    // Create JWT token
    const jwtToken = CaseJWTManager.createCaseJWT({
      caseId: body.caseId,
      userId: user.id,
      primaryContext: body.primaryContext,
      expiresIn: body.expiresIn
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
        caseId: body.caseId,
        userId: user.id,
        sessionId,
        expiresAt,
        isActive: true
      }
    });

    // Update case with session ID
    await prisma.case.update({
      where: { id: body.caseId },
      data: { sessionId }
    });

    // Create response with JWT cookie
    const response = NextResponse.json({
      success: true,
      session: caseSession,
      jwt: jwtToken
    });

    // Set JWT cookie
    const cookieOptions = CaseJWTManager.getCookieOptions();
    response.cookies.set('case-context', jwtToken, cookieOptions);

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

    // Get active cases with sessions
    const activeCases = await prisma.case.findMany({
      where: {
        userId: user.id,
        sessionId: { not: null },
        isCompleted: false
      },
      include: {
        department: true,
        caseSessions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const cases = activeCases.map(caseRecord => ({
      id: caseRecord.id,
      sessionId: caseRecord.sessionId!,
      department: { name: caseRecord.department.name },
      openingLine: caseRecord.openingLine,
      difficultyLevel: caseRecord.difficultyLevel,
      isPediatric: caseRecord.isPediatric,
      createdAt: caseRecord.createdAt,
      updatedAt: caseRecord.updatedAt
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
