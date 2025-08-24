// Feedback Types

interface Feedback {
  diagnosis: string;
  keyLearningPoint: string; // Changed from keyTakeaway to keyLearningPoint
  whatYouDidWell: string[]; // Expanded to 4-5 points
  whatCouldBeImproved: string[]; // Will be moved to collapsible section
  clinicalTip: string; // Will be replaced by clinical pearls
}

interface ConsultantTeachingNotes {
  diagnosis: string;
  keyLearningPoint: string;
  clerkingStructure: string;
  missedOpportunities: Array<{
    opportunity: string;
    clinicalSignificance: string;
  }>;
  clinicalReasoning: string;
  communicationNotes: string;
  clinicalPearls: string[];
}

// New comprehensive feedback interface that merges basic and detailed feedback
interface ComprehensiveFeedback {
  // Essential (always visible)
  diagnosis: string;
  keyLearningPoint: string;
  whatYouDidWell: string[]; // 4-5 points including positive communication/clerking feedback
  clinicalReasoning: string;
  
  // Collapsible sections
  clinicalOpportunities: {
    areasForImprovement: string[];
    missedOpportunities: Array<{
      opportunity: string;
      clinicalSignificance: string;
    }>;
  };
  clinicalPearls: string[];
}

// Keep the old interface for backward compatibility with the feedback page
interface DetailedFeedbackReport extends Feedback {
  positiveQuotes: { quote: string; explanation: string; }[];
  improvementQuotes: { quote: string; explanation: string; }[];
}

export type {
  Feedback,
  ConsultantTeachingNotes,
  ComprehensiveFeedback,
  DetailedFeedbackReport
};
