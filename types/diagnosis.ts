// Diagnosis Types

import type { PatientProfile, PediatricProfile, DifficultyLevel } from './shared';
import type { Message } from './conversation';
import type { ExaminationResult } from './examination';
import type { InvestigationResult } from './investigation';
import type { Feedback, ComprehensiveFeedback } from './feedback';
import type { OSCEFollowUpQuestion } from './osce';

interface Case {
  diagnosis: string;
  primaryInfo: string;
  openingLine: string;
  patientProfile?: PatientProfile;
  pediatricProfile?: PediatricProfile; // For pediatric cases
  isPediatric?: boolean;
}

interface OSCECase extends Case {
  followUpQuestions: OSCEFollowUpQuestion[];
}

interface PrimaryContext {
  diagnosis: string;
  primaryInfo: string;
  openingLine: string;
  patientProfile?: PatientProfile;
  pediatricProfile?: PediatricProfile;
  isPediatric: boolean;
  department: string;
  difficultyLevel: DifficultyLevel;
}

interface SecondaryContext {
  messages: Message[];
  preliminaryDiagnosis: string;
  examinationPlan: string;
  investigationPlan: string;
  examinationResults: ExaminationResult[];
  investigationResults: InvestigationResult[];
  finalDiagnosis: string;
  managementPlan: string;
  feedback: Feedback | ComprehensiveFeedback | null;
}

export type {
  Case,
  OSCECase,
  PrimaryContext,
  SecondaryContext
};
