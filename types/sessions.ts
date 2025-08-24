// Session Management and Secondary Context Types

import type { Message } from './conversation';
import type { ExaminationResult } from './examination';
import type { InvestigationResult } from './investigation';
import type { PrimaryContext, SecondaryContext } from './diagnosis';
import type { CaseSession, SessionValidationResult } from './shared';

// localStorage Storage Types
interface LocalStorageCase {
  caseId: string;
  department: string | null;
  secondaryContext: SecondaryContext;
  lastUpdated: string;
  isActive: boolean;
}

// Session State Types
interface SessionState {
  caseId: string;
  sessionId: string;
  isActive: boolean;
  expiresAt: Date;
  primaryContext: PrimaryContext;
  secondaryContext: SecondaryContext;
}

// Case Resumption Types
interface CaseResumptionData {
  caseId: string;
  sessionId: string;
  primaryContext: PrimaryContext;
  secondaryContext: SecondaryContext;
  lastUpdated: Date;
}

// Active Case Types
interface ActiveCase {
  id: string;
  sessionId: string;
  department: {
    name: string;
  };
  openingLine: string;
  difficultyLevel: string;
  isPediatric: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Session Management API Types
interface CreateCaseSessionRequest {
  caseId: string;
  userId: string;
  primaryContext: PrimaryContext;
  expiresIn?: number; // seconds
}

interface ValidateCaseSessionRequest {
  sessionId: string;
  userId: string;
  caseId: string;
}

interface InvalidateCaseSessionRequest {
  sessionId: string;
  userId: string;
  caseId: string;
}

interface GetActiveCasesRequest {
  userId: string;
  limit?: number;
}

// API Response Types
interface CreateCaseSessionResponse {
  success: boolean;
  session?: CaseSession;
  jwt?: string;
  error?: string;
}

interface ValidateCaseSessionResponse {
  success: boolean;
  isValid: boolean;
  session?: CaseSession;
  primaryContext?: PrimaryContext;
  error?: string;
}

interface GetActiveCasesResponse {
  success: boolean;
  cases: ActiveCase[];
  error?: string;
}

interface InvalidateCaseSessionResponse {
  success: boolean;
  error?: string;
}

// Storage Management Types
interface StorageManager {
  saveSecondaryContext(caseId: string, context: SecondaryContext): Promise<boolean>;
  loadSecondaryContext(caseId: string): Promise<SecondaryContext | null>;
  updateSecondaryContext(caseId: string, updates: Partial<SecondaryContext>): Promise<boolean>;
  clearSecondaryContext(caseId: string): Promise<boolean>;
  getAllActiveCases(): Promise<LocalStorageCase[]>;
  clearAllCases(): Promise<boolean>;
}

// Session Validation Types
interface SessionValidator {
  validateSession(sessionId: string, userId: string, caseId: string): Promise<SessionValidationResult>;
  isSessionExpired(session: CaseSession): boolean;
  canResumeCase(session: CaseSession, userId: string): boolean;
}

// Error Types
interface SessionError {
  code: 'SESSION_NOT_FOUND' | 'SESSION_EXPIRED' | 'SESSION_INVALID' | 'UNAUTHORIZED_ACCESS' | 'CASE_NOT_FOUND';
  message: string;
  details?: Record<string, unknown>;
}

// Utility Types
interface SessionUtils {
  generateSessionId(): string;
  calculateExpirationTime(expiresIn: number): Date;
  isSessionActive(session: CaseSession): boolean;
}

export type {
  LocalStorageCase,
  SessionState,
  CaseResumptionData,
  ActiveCase,
  CreateCaseSessionRequest,
  ValidateCaseSessionRequest,
  InvalidateCaseSessionRequest,
  GetActiveCasesRequest,
  CreateCaseSessionResponse,
  ValidateCaseSessionResponse,
  GetActiveCasesResponse,
  InvalidateCaseSessionResponse,
  StorageManager,
  SessionValidator,
  SessionError,
  SessionUtils,
  PrimaryContext,
  SecondaryContext,
  CaseSession,
  SessionValidationResult
};
