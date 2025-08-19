import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../auth';
import { prisma } from '../database/prisma';
import { validateCaseSession } from '../session/session-manager';
import { getPrimaryContext } from '../cache/primary-context-cache';
import type { PrimaryContext } from '../../types/diagnosis';

export interface SessionMiddlewareContext {
  user: {
    id: string;
    email: string;
  };
  caseSession: {
    id: string;
    caseId: string;
    sessionId: string;
    isActive: boolean;
    expiresAt: Date;
  };
  primaryContext: PrimaryContext;
  requestBody?: any; // Add parsed request body
}

export interface SessionMiddlewareOptions {
  requireSession?: boolean;
  requireActiveCase?: boolean;
}

/**
 * Session Middleware for validating case sessions
 * Uses cache and database instead of JWT
 */
export async function withSessionMiddleware(
  request: NextRequest,
  handler: (context: SessionMiddlewareContext) => Promise<NextResponse>,
  options: SessionMiddlewareOptions = {}
): Promise<NextResponse> {
  try {
    const { requireSession = true, requireActiveCase = true } = options;

    // Get user session with proper typing
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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

    // If session is not required, proceed without session validation
    if (!requireSession) {
      const context: SessionMiddlewareContext = {
        user: {
          id: user.id,
          email: user.email
        },
        caseSession: {
          id: '',
          caseId: '',
          sessionId: '',
          isActive: false,
          expiresAt: new Date()
        },
        primaryContext: {
          diagnosis: '',
          primaryInfo: '',
          openingLine: '',
          isPediatric: false,
          department: '',
          difficultyLevel: 'standard'
        }
      };

      return handler(context);
    }

    // Get session info from request body or headers
    const body = await request.json().catch(() => ({}));
    const { caseId, sessionId } = body;

    if (!caseId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Case ID and Session ID are required' },
        { status: 400 }
      );
    }

    // Validate session
    const sessionValidation = await validateCaseSession({
      sessionId,
      userId: user.id,
      caseId
    });

    if (!sessionValidation.isValid) {
      return NextResponse.json(
        { success: false, error: sessionValidation.error || 'Invalid session' },
        { status: 401 }
      );
    }

    // Get primary context from cache with database fallback
    const cachedContext = await getPrimaryContext(caseId);

    if (!cachedContext) {
      return NextResponse.json(
        { success: false, error: 'Case context not found' },
        { status: 404 }
      );
    }

    // Verify user owns the session
    if (cachedContext.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    const context: SessionMiddlewareContext = {
      user: {
        id: user.id,
        email: user.email
      },
      caseSession: {
        id: sessionValidation.session?.id || '',
        caseId: sessionValidation.session?.caseId || '',
        sessionId: sessionValidation.session?.sessionId || '',
        isActive: sessionValidation.session?.isActive || false,
        expiresAt: sessionValidation.session?.expiresAt || new Date()
      },
      primaryContext: cachedContext.primaryContext,
      requestBody: body // Pass the parsed body to the handler
    };

    return handler(context);

  } catch (error) {
    console.error('Session middleware error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create middleware with specific options
 */
export function createSessionMiddleware(options: SessionMiddlewareOptions = {}) {
  return (
    request: NextRequest,
    handler: (context: SessionMiddlewareContext) => Promise<NextResponse>
  ) => withSessionMiddleware(request, handler, options);
}

/**
 * Predefined middleware configurations
 */
export const requireActiveSession = createSessionMiddleware({
  requireSession: true,
  requireActiveCase: true
});

export const requireSession = createSessionMiddleware({
  requireSession: true,
  requireActiveCase: false
});

export const optionalSession = createSessionMiddleware({
  requireSession: false,
  requireActiveCase: false
});
