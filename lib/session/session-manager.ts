import { prisma } from '../database/prisma';
import type { CreateSessionRequest, SessionValidationRequest } from '../../types/auth';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new case session
 */
export async function createCaseSession(request: CreateSessionRequest): Promise<{
  sessionId: string;
  expiresAt: Date;
}> {
  const { caseId, userId, expiresIn = 3600 * 24 } = request; // Default 24 hours

  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // Create session record in database
  const caseSession = await prisma.caseSession.create({
    data: {
      caseId,
      userId,
      sessionId,
      expiresAt,
      isActive: true
    }
  });

  console.log(`✅ Created case session: ${sessionId} for case: ${caseId}`);

  return {
    sessionId: caseSession.sessionId,
    expiresAt: caseSession.expiresAt
  };
}

/**
 * Validate a case session
 */
export async function validateCaseSession(request: SessionValidationRequest): Promise<{
  isValid: boolean;
  session?: any;
  error?: string;
}> {
  const { sessionId, userId, caseId } = request;

  try {
    // Find active session
    const session = await prisma.caseSession.findFirst({
      where: {
        sessionId,
        caseId,
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      return {
        isValid: false,
        error: 'Session not found or expired'
      };
    }

    return {
      isValid: true,
      session
    };

  } catch (error) {
    console.error('Error validating session:', error);
    return {
      isValid: false,
      error: 'Session validation failed'
    };
  }
}

/**
 * Deactivate a case session
 */
export async function deactivateCaseSession(sessionId: string): Promise<void> {
  try {
    await prisma.caseSession.updateMany({
      where: { sessionId },
      data: { isActive: false }
    });

    console.log(`✅ Deactivated session: ${sessionId}`);
  } catch (error) {
    console.error('Error deactivating session:', error);
  }
}

/**
 * Get active sessions for a user
 */
export async function getActiveSessions(userId: string): Promise<any[]> {
  try {
    const sessions = await prisma.caseSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        case: {
          include: {
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return sessions;
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const result = await prisma.caseSession.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true
      },
      data: { isActive: false }
    });

    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired sessions`);
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}
