import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../auth';
import { CaseJWTManager } from '../jwt/case-jwt';
import { prisma } from '../database/prisma';
import type { CaseJWT } from '../../types/auth';

export interface JWTMiddlewareContext {
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
  primaryContext: CaseJWT['primaryContext'];
}

export interface JWTMiddlewareOptions {
  requireSession?: boolean;
  requireActiveCase?: boolean;
}

/**
 * JWT Middleware for validating case sessions
 * Extracts and validates JWT from cookies, then provides session context
 */
export async function withJWTMiddleware(
  request: NextRequest,
  handler: (context: JWTMiddlewareContext) => Promise<NextResponse>,
  options: JWTMiddlewareOptions = {}
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

    // If session is not required, proceed without JWT validation
    if (!requireSession) {
      const context: JWTMiddlewareContext = {
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

    // Get JWT from cookies
    const cookies = request.headers.get('cookie') || '';
    const jwtToken = CaseJWTManager.extractJWTFromCookies(cookies);

    if (!jwtToken) {
      return NextResponse.json(
        { success: false, error: 'No session token found' },
        { status: 401 }
      );
    }

    // Validate JWT
    const jwtValidation = CaseJWTManager.validateCaseJWT(jwtToken);
    if (!jwtValidation.isValid || !jwtValidation.decoded) {
      return NextResponse.json(
        { success: false, error: jwtValidation.error || 'Invalid session token' },
        { status: 401 }
      );
    }

    const { caseId, userId, sessionId, primaryContext } = jwtValidation.decoded;

    // Verify user owns the session
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Session does not belong to user' },
        { status: 403 }
      );
    }

    // If active case is required, validate session in database
    if (requireActiveCase) {
      const caseSession = await prisma.caseSession.findFirst({
        where: {
          sessionId,
          caseId,
          userId: user.id,
          isActive: true
        }
      });

      if (!caseSession) {
        return NextResponse.json(
          { success: false, error: 'Session not found or inactive' },
          { status: 404 }
        );
      }

      // Check if session is expired
      if (caseSession.expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Session has expired' },
          { status: 401 }
        );
      }

      const context: JWTMiddlewareContext = {
        user: {
          id: user.id,
          email: user.email
        },
        caseSession: {
          id: caseSession.id,
          caseId: caseSession.caseId,
          sessionId: caseSession.sessionId,
          isActive: caseSession.isActive,
          expiresAt: caseSession.expiresAt
        },
        primaryContext
      };

      return handler(context);
    }

    // If active case is not required, proceed with JWT data only
    const context: JWTMiddlewareContext = {
      user: {
        id: user.id,
        email: user.email
      },
      caseSession: {
        id: '',
        caseId,
        sessionId,
        isActive: true,
        expiresAt: CaseJWTManager.getJWTExpiration(jwtToken) || new Date()
      },
      primaryContext
    };

    return handler(context);

  } catch (error) {
    console.error('JWT middleware error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create middleware with specific options
 */
export function createJWTMiddleware(options: JWTMiddlewareOptions = {}) {
  return (
    request: NextRequest,
    handler: (context: JWTMiddlewareContext) => Promise<NextResponse>
  ) => withJWTMiddleware(request, handler, options);
}

/**
 * Predefined middleware configurations
 */
export const requireActiveSession = createJWTMiddleware({
  requireSession: true,
  requireActiveCase: true
});

export const requireSession = createJWTMiddleware({
  requireSession: true,
  requireActiveCase: false
});

export const optionalSession = createJWTMiddleware({
  requireSession: false,
  requireActiveCase: false
});
