// Authentication and Session Types

import type { PrimaryContext } from './diagnosis';
import type { CaseSession, SessionValidationResult } from './shared';

interface User {
  id: string;
  email: string;
  country?: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id: string;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

// Session Management Types
interface CreateSessionRequest {
  caseId: string;
  userId: string;
  expiresIn?: number; // seconds, default 1 hour
}

interface SessionValidationRequest {
  sessionId: string;
  userId: string;
  caseId: string;
}

// API Response Types
interface AuthResponse {
  success: boolean;
  user?: User;
  session?: CaseSession;
  error?: string;
}

interface SessionResponse {
  success: boolean;
  session?: CaseSession;
  error?: string;
}

// Error Types
interface AuthError {
  code: 'UNAUTHORIZED' | 'INVALID_SESSION' | 'SESSION_EXPIRED' | 'CASE_NOT_FOUND';
  message: string;
  details?: Record<string, unknown>;
}

// Cache Types
interface CachedPrimaryContext {
  primaryContext: PrimaryContext;
  caseId: string;
  userId: string;
  sessionId: string;
  cachedAt: Date;
  expiresAt: Date;
}

export type {
  User,
  Session,
  CreateSessionRequest,
  SessionValidationRequest,
  AuthResponse,
  SessionResponse,
  AuthError,
  CachedPrimaryContext,
  PrimaryContext,
  CaseSession,
  SessionValidationResult
};
