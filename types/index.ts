import React from 'react';

export interface Department {
  name: string;
  icon: string;
  gradient: string;
  description: string;
  avatar: string;
}

export interface Message {
  sender: 'student' | 'patient' | 'system';
  text: string;
  timestamp: string;
}

export interface InvestigationResult {
  name: string;
  value: number;
  unit: string;
  range: {
    low: number;
    high: number;
  };
  status: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface Feedback {
    diagnosis: string;
    keyTakeaway: string;
    whatYouDidWell: string[];
    whatCouldBeImproved: string[];
    clinicalTip: string;
}

export interface DetailedFeedbackReport extends Feedback {
    positiveQuotes: { quote: string; explanation: string; }[];
    improvementQuotes: { quote: string; explanation: string; }[];
}

export interface Case {
    diagnosis: string;
    primaryInfo: string;
    openingLine: string;
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