// OSCE Follow-up Questions Types

export interface OSCEQuestion {
  id: string;
  domain: 'primary_diagnosis' | 'differential_diagnosis' | 'risk_factors' | 'investigations' | 'management' | 'complications';
  question: string;
}

export interface OSCEQuestionWithAnswer extends OSCEQuestion {
  answer: string;
}

export interface OSCEFollowupQuestionsResponse {
  success: boolean;
  questions: OSCEQuestion[];
}

export interface OSCEStudentResponse {
  questionId: string;
  studentAnswer: string;
}

export interface OSCEEvaluationRequest {
  responses: OSCEStudentResponse[];
}

export interface OSCEEvaluationResult {
  questionId: string;
  correctAnswer: string;
  studentAnswer: string;
  score: number; // 0-100
  feedback: string;
}

export interface OSCEEvaluationResponse {
  success: boolean;
  overallScore: number;
  results: OSCEEvaluationResult[];
  feedback: string;
}

export interface OSCEGenerationStatus {
  caseId: string;
  status: 'pending' | 'generating' | 'retrying' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  startedAt: string;
  completedAt?: string;
}

// OSCE Evaluation Types
export interface OSCEScoreBreakdown {
  historyCoverage: number; // 0-100
  relevanceOfQuestions: number; // 0-100  
  clinicalReasoning: number; // 0-100
  followupQuestions: number; // 0-100
  overallScore: number; // Average of above 4
}

export interface OSCEEvaluation {
  diagnosis: string;
  scoreBreakdown: OSCEScoreBreakdown;
  rationaleForScore: string; // Contextual explanation of why they got these scores
  clinicalOpportunities: {
    areasForImprovement: string[];
    missedOpportunities: Array<{
      opportunity: string;
      clinicalSignificance: string;
    }>;
  };
  followupAnswers: Array<{
    questionId: string;
    question: string;
    correctAnswer: string;
  }>;
  clinicalPearls: string[];
}

export interface OSCEEvaluationRequest {
  studentResponses: OSCEStudentResponse[];
}

export interface OSCEEvaluationAPIResponse {
  success: boolean;
  evaluation: OSCEEvaluation;
}
