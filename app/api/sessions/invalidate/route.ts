import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';
import type {   
  InvalidateCaseSessionRequest,
  InvalidateCaseSessionResponse
} from '../../../../types/sessions';

/**
 * POST /api/sessions/invalidate - Invalidate a case session
 */
export async function POST(request: NextRequest): Promise<NextResponse<InvalidateCaseSessionResponse>> {
  try {
    // Get user session with proper typing
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as InvalidateCaseSessionRequest;
    
    // Validate request
    if (!body.sessionId || !body.caseId) {
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

    // Invalidate session in database
    await prisma.caseSession.updateMany({
      where: {
        sessionId: body.sessionId,
        caseId: body.caseId,
        userId: user.id
      },
      data: {
        isActive: false
      }
    });

    // Clear session ID from case
    await prisma.case.update({
      where: { id: body.caseId },
      data: { sessionId: null }
    });

    // Create response that clears the JWT cookie
    const response = NextResponse.json({
      success: true
    });

    // Clear the JWT cookie
    response.cookies.set('case-context', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Session invalidation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
