// Authentication and JWT Types

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

// JWT Types
interface CaseJWT {
  caseId: string;
  userId: string;
  sessionId: string;
  primaryContext: PrimaryContext;
  iat: number;
  exp: number;
}

// JWT Validation Result
interface JWTValidationResult {
  isValid: boolean;
  decoded?: CaseJWT;
  error?: string;
}

// Session Management Types
interface CreateSessionRequest {
  caseId: string;
  userId: string;
  primaryContext: PrimaryContext;
  expiresIn?: number; // seconds, default 7 days
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
  code: 'UNAUTHORIZED' | 'INVALID_SESSION' | 'SESSION_EXPIRED' | 'INVALID_JWT' | 'CASE_NOT_FOUND';
  message: string;
  details?: Record<string, unknown>;
}

// Cookie Types
interface JWTCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

// Default cookie options
const DEFAULT_JWT_COOKIE_OPTIONS: JWTCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  path: '/'
};

export type {
  User,
  Session,
  CaseJWT,
  JWTValidationResult,
  CreateSessionRequest,
  SessionValidationRequest,
  AuthResponse,
  SessionResponse,
  AuthError,
  JWTCookieOptions,
  PrimaryContext,
  CaseSession,
  SessionValidationResult
};

export {
  DEFAULT_JWT_COOKIE_OPTIONS
};
