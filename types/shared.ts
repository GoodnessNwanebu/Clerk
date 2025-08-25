// Shared Types - Common types used across multiple files

// Patient Profile Types
interface PatientProfile {
  educationLevel: 'basic' | 'moderate' | 'well-informed';
  healthLiteracy: 'minimal' | 'average' | 'high';
  occupation: string;
  recordKeeping: 'detailed' | 'basic' | 'minimal';
}

interface PediatricProfile {
  patientAge: number;
  ageGroup: 'infant' | 'toddler' | 'preschool' | 'school-age' | 'adolescent';
  respondingParent: 'mother' | 'father';
  parentProfile: PatientProfile;
  developmentalStage: string;
  communicationLevel: 'non-verbal' | 'basic' | 'conversational' | 'adult-like';
}

type DifficultyLevel = 'standard' | 'intermediate' | 'difficult';

// Session Types
interface CaseSession {
  id: string;
  caseId: string;
  userId: string;
  sessionId: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionValidationResult {
  isValid: boolean;
  session?: CaseSession;
  error?: string;
}

export type {
  PatientProfile,
  PediatricProfile,
  DifficultyLevel,
  CaseSession,
  SessionValidationResult
};
