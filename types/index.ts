import React from 'react';

export interface Department {
  name: string;
  icon: string;
  gradient: string;
  description: string;
  avatar: string;
}

export interface Message {
  sender: 'student' | 'patient' | 'parent' | 'system';
  text: string;
  timestamp: string;
  speakerLabel?: string; // For pediatric cases: "Mother", "Father", "Child"
}

// Base interface for all investigation results
export interface BaseInvestigationResult {
  name: string;
  type: 'quantitative' | 'descriptive';
  category: 'laboratory' | 'imaging' | 'pathology' | 'specialized';
  urgency: 'routine' | 'urgent' | 'critical';
}

// Quantitative results (for graphs/charts)
export interface QuantitativeResult extends BaseInvestigationResult {
  type: 'quantitative';
  value: number;
  unit: string;
  range: {
    low: number;
    high: number;
  };
  status: 'Normal' | 'High' | 'Low' | 'Critical';
}

// Descriptive results (for reports)
export interface DescriptiveResult extends BaseInvestigationResult {
  type: 'descriptive';
  findings: string;
  impression: string;
  recommendation?: string;
  abnormalFlags: string[];
  reportType: 'radiology' | 'pathology' | 'ecg' | 'echo' | 'specialist';
}

// Union type for all investigation results
export type InvestigationResult = QuantitativeResult | DescriptiveResult;

// Legacy type alias for backward compatibility
export type LegacyInvestigationResult = QuantitativeResult;

export interface Feedback {
    diagnosis: string;
    keyTakeaway: string;
    whatYouDidWell: string[];
    whatCouldBeImproved: string[];
    clinicalTip: string;
}

export interface ConsultantTeachingNotes {
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

// Keep the old interface for backward compatibility with the feedback page
export interface DetailedFeedbackReport extends Feedback {
    positiveQuotes: { quote: string; explanation: string; }[];
    improvementQuotes: { quote: string; explanation: string; }[];
}

// Patient profile types
export interface PatientProfile {
    educationLevel: 'basic' | 'moderate' | 'well-informed';
    healthLiteracy: 'minimal' | 'average' | 'high';
    occupation: string;
    recordKeeping: 'detailed' | 'basic' | 'minimal';
}

// Pediatric-specific patient profile
export interface PediatricProfile {
    patientAge: number; // Age in years
    ageGroup: 'infant' | 'toddler' | 'preschool' | 'school-age' | 'adolescent';
    respondingParent: 'mother' | 'father';
    parentProfile: PatientProfile;
    developmentalStage: string;
    communicationLevel: 'non-verbal' | 'basic' | 'conversational' | 'adult-like';
}

export interface Case {
    diagnosis: string;
    primaryInfo: string;
    openingLine: string;
    patientProfile?: PatientProfile;
    pediatricProfile?: PediatricProfile; // For pediatric cases
    isPediatric?: boolean;
}

export interface CaseState {
  department: Department | null;
  caseDetails: Case | null;
  messages: Message[];
  preliminaryDiagnosis: string;
  investigationPlan: string;
  investigationResults: InvestigationResult[];
  finalDiagnosis: string;
  managementPlan: string;
  feedback: Feedback | null;
}

export type Theme = 'light' | 'dark';
export type ThemeSetting = Theme | 'system';

export interface PatientResponse {
    messages: {
        response: string;
        sender: 'patient' | 'parent';
        speakerLabel: string;
    }[];
}