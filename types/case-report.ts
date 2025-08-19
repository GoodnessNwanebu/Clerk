// Case Report and State Types

import type { Message } from './conversation';
import type { ExaminationResult } from './examination';
import type { InvestigationResult } from './investigation';
import type { Feedback, ComprehensiveFeedback } from './feedback';

// Case State Types
interface CaseState {
  department: string | null;
  caseId: string | null;
  sessionId: string | null;
  caseDetails: any | null;
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

// Case Report Types
interface CaseReport {
  id: string;
  caseId: string;
  patientInfo: {
    age: string;
    gender: string;
    presentingComplaint: string;
    historyOfPresentingIllness: string;
    pastMedicalHistory: string;
    medications: string;
    allergies: string;
    socialHistory: string;
    familyHistory: string;
  };
  examination: {
    generalExamination: string;
    systemicExamination: string;
    findings: string[];
  };
  investigations: {
    requested: string[];
    results: string[];
  };
  assessment: {
    differentialDiagnosis: string[];
    finalDiagnosis: string;
    reasoning: string;
  };
  management: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    followUp: string;
  };
  learningPoints: string[];
  createdAt: Date;
  isVisible: boolean;
}

// Case Completion Types
interface CompleteCaseRequest {
  finalDiagnosis: string;
  managementPlan: string;
  examinationResults: ExaminationResult[];
  investigationResults: InvestigationResult[];
  messages: Message[];
  makeVisible?: boolean; // User's visibility preference
}

interface CompleteCaseResponse {
  success: boolean;
  caseId: string;
  message: string;
  feedback: ComprehensiveFeedback;
  caseReport: CaseReport;
}

// Saved Cases Types
interface SavedCase {
  id: string;
  department: string;
  diagnosis: string;
  completedAt: Date;
  isVisible: boolean;
  caseReport?: CaseReport;
}

interface GetSavedCasesResponse {
  success: boolean;
  cases: SavedCase[];
}

interface UpdateCaseVisibilityRequest {
  caseId: string;
  isVisible: boolean;
}

interface UpdateCaseVisibilityResponse {
  success: boolean;
  message: string;
}

export type {
  CaseState,
  CaseReport,
  CompleteCaseRequest,
  CompleteCaseResponse,
  SavedCase,
  GetSavedCasesResponse,
  UpdateCaseVisibilityRequest,
  UpdateCaseVisibilityResponse
};
