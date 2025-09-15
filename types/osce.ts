// OSCE Mode Type Definitions

export type OSCEMode = 'simulation' | 'practice';

export type OSCEDepartment = 
  | 'obstetrics'
  | 'gynecology' 
  | 'pediatrics'
  | 'internal medicine'
  | 'surgery'
  | 'dentistry';

export type OSCECaseType = 'single-diagnosis' | 'custom';

export interface OSCESession {
  mode: OSCEMode;
  department: OSCEDepartment;
  caseType?: OSCECaseType; // Only for practice mode
  customCondition?: string; // Only for custom case type
  caseId: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
}

export interface OSCEFollowUpQuestion {
  id: string;
  question: string;
  category: 'diagnosis' | 'management' | 'investigation' | 'complications' | 'clinical reasoning';
  correctAnswer: string;
  explanation: string;
  isAnswered: boolean;
  studentAnswer?: string;
  isCorrect?: boolean;
}

export interface OSCEScore {
  historyTakingStructure: number; // /100
  questionRelevance: number; // /100
  historyCoverage: number; // /100
  diagnosticAccuracy: number; // /100
  followUpQuestions: number; // /100
  overallScore: number; // /100
}

export interface OSCEEvaluation {
  sessionId: string;
  scores: OSCEScore;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    followUpCorrections: Array<{
      questionId: string;
      question: string;
      studentAnswer: string;
      correctAnswer: string;
      explanation: string;
    }>;
  };
  completedAt: string;
}

export interface OSCEState {
  currentSession?: OSCESession;
  followUpQuestions: OSCEFollowUpQuestion[];
  evaluation?: OSCEEvaluation;
  isInOSCEMode: boolean;
  timeRemaining?: number; // seconds
}
