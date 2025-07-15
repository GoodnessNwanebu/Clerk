'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { CaseState, Department, Feedback, InvestigationResult, Message, Case } from '../types';
import { generateClinicalCase } from '../services/geminiService';

interface AppContextType {
  caseState: CaseState;
  isGeneratingCase: boolean;
  userEmail: string | null;
  userCountry: string | null;
  setUserEmail: (email: string) => void;
  setUserCountry: (country: string) => void;
  generateNewCase: (department: Department) => Promise<void>;
  addMessage: (message: Message) => void;
  setPreliminaryData: (diagnosis: string, plan: string) => void;
  setInvestigationResults: (results: InvestigationResult[]) => void;
  setFinalData: (diagnosis: string, plan: string) => void;
  setFeedback: (feedback: Feedback) => void;
  resetCase: () => void;
}

const initialCaseState: CaseState = {
  department: null,
  caseDetails: null,
  messages: [],
  preliminaryDiagnosis: '',
  investigationPlan: '',
  investigationResults: [],
  finalDiagnosis: '',
  managementPlan: '',
  feedback: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [caseState, setCaseState] = useState<CaseState>(initialCaseState);
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [userEmail, setUserEmailState] = useState<string | null>(null);
  const [userCountry, setUserCountryState] = useState<string | null>(null);
  const isBrowser = typeof window !== 'undefined';

  useEffect(() => {
    if (!isBrowser) return;
    
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setUserEmailState(storedEmail);
    }

    const storedCountry = localStorage.getItem('userCountry');
    if (storedCountry) {
      setUserCountryState(storedCountry);
    }
  }, [isBrowser]);

  const setUserEmail = (email: string) => {
    if (isBrowser) {
      localStorage.setItem('userEmail', email);
    }
    setUserEmailState(email);
  };

  const setUserCountry = (country: string) => {
    if (isBrowser) {
      localStorage.setItem('userCountry', country);
    }
    setUserCountryState(country);
  };
  
  const generateNewCase = useCallback(async (department: Department) => {
    setIsGeneratingCase(true);
    try {
      const newCase = await generateClinicalCase(department.name, userCountry || undefined);
      if (!newCase) {
        throw new Error(`Failed to generate a case for ${department.name}`);
      }
      
      setCaseState({
        ...initialCaseState,
        department,
        caseDetails: newCase,
        messages: [{
            sender: 'system',
            text: `The patient is here today with the following complaint:\n\n"${newCase.openingLine}"`,
            timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
        console.error("Error in generateNewCase:", error);
        // Rethrow the error to be caught by the caller UI
        throw error;
    } finally {
        setIsGeneratingCase(false);
    }
  }, [userCountry]);
  
  const addMessage = useCallback((message: Message) => {
    setCaseState((prev: CaseState) => ({ ...prev, messages: [...prev.messages, message] }));
  }, []);

  const setPreliminaryData = useCallback((diagnosis: string, plan: string) => {
    setCaseState((prev: CaseState) => ({ ...prev, preliminaryDiagnosis: diagnosis, investigationPlan: plan }));
  }, []);

  const setInvestigationResults = useCallback((results: InvestigationResult[]) => {
    setCaseState((prev: CaseState) => ({ ...prev, investigationResults: results }));
  }, []);

  const setFinalData = useCallback((diagnosis: string, plan: string) => {
    setCaseState((prev: CaseState) => ({ ...prev, finalDiagnosis: diagnosis, managementPlan: plan }));
  }, []);

  const setFeedback = useCallback((feedback: Feedback) => {
    setCaseState((prev: CaseState) => ({ ...prev, feedback }));
  }, []);

  const resetCase = useCallback(() => {
    setCaseState(initialCaseState);
  }, []);

  const value = { caseState, isGeneratingCase, userEmail, userCountry, setUserEmail, setUserCountry, generateNewCase, addMessage, setPreliminaryData, setInvestigationResults, setFinalData, setFeedback, resetCase };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};