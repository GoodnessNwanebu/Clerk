'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { 
  CaseState, 
  Department, 
  Message, 
  InvestigationResult, 
  ExaminationResult, 
  Feedback, 
  ComprehensiveFeedback,
  DifficultyLevel 
} from '../types';
import { generateClinicalCase, generateClinicalCaseWithDifficulty, generatePracticeCase as generatePracticeCaseService } from '../services/geminiService';
import { ConversationStorage } from '../lib/localStorage';
import { getCaseFeedback, getDetailedCaseFeedback, getComprehensiveCaseFeedback } from '../services/geminiService';

interface AppContextType {
  caseState: CaseState;
  isGeneratingCase: boolean;
  userEmail: string | null;
  userCountry: string | null;
  setUserEmail: (email: string) => void;
  setUserCountry: (country: string) => void;
  generateNewCase: (department: Department) => Promise<void>;
  generateNewCaseWithDifficulty: (department: Department, difficulty: DifficultyLevel) => Promise<void>;
  generatePracticeCase: (department: Department, condition: string, difficulty?: DifficultyLevel) => Promise<void>;
  addMessage: (message: Message) => void;
  setPreliminaryData: (diagnosis: string, examinationPlan: string, investigationPlan: string) => void;
  setInvestigationResults: (results: InvestigationResult[]) => void;
  setExaminationResults: (results: ExaminationResult[]) => void;
  setFinalData: (diagnosis: string, plan: string) => void;
  setFeedback: (feedback: Feedback | ComprehensiveFeedback) => void;
  resetCase: () => void;
  saveConversationToDatabase: () => Promise<void>;
  saveCaseStateToDatabase: () => Promise<void>;
  saveResultsToDatabase: () => Promise<void>;
  saveFeedbackToDatabase: () => Promise<void>;
  savePatientInfoToDatabase: () => Promise<void>;
  saveCompletedCaseToDatabase: () => Promise<boolean>;
}

const initialCaseState: CaseState = {
  department: null,
  caseDetails: null,
  messages: [],
  preliminaryDiagnosis: '',
  examinationPlan: '',
  investigationPlan: '',
  examinationResults: [],
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
  const [conversationStorage, setConversationStorage] = useState<ConversationStorage | null>(null);
  const isBrowser = typeof window !== 'undefined';

  // Restore case state from localStorage on mount
  useEffect(() => {
    if (!isBrowser) return;
    
    // Try to find the most recent case in localStorage
    const keys = Object.keys(localStorage);
    const caseKeys = keys.filter(key => key.startsWith('clerksmart_case_'));
    
    if (caseKeys.length > 0) {
      // Get the most recent case
      const mostRecentKey = caseKeys.sort().pop()!;
      const storage = new ConversationStorage(mostRecentKey.replace('clerksmart_case_', ''));
      const savedData = storage.loadConversation();
      
      if (savedData && savedData.caseState.department) {
        setConversationStorage(storage);
        setCaseState(prev => ({
          ...prev,
          ...savedData.caseState,
          messages: savedData.conversation
        }));
      }
    }
  }, [isBrowser]);

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
    // Default to standard difficulty for backward compatibility
    return generateNewCaseWithDifficulty(department, 'standard');
  }, []);

  const generateNewCaseWithDifficulty = useCallback(async (department: Department, difficulty: DifficultyLevel) => {
    setIsGeneratingCase(true);
    try {
      const newCase = await retryWithBackoff(
        () => generateClinicalCaseWithDifficulty(department.name, difficulty, userCountry || undefined),
        3, // 3 retries
        1000, // 1s base delay
        `Generate case for ${department.name}`
      );
      
      if (!newCase) {
        throw new Error(`Failed to generate a case for ${department.name}`);
      }
      
      // Generate a unique case ID
      const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize localStorage for this case
      const storage = new ConversationStorage(caseId);
      setConversationStorage(storage);
      
      const newCaseState = {
        ...initialCaseState,
        department,
        caseDetails: newCase,
        messages: [{
            sender: 'system' as const,
            text: `The patient is here today with the following complaint:\n\n"${newCase.openingLine}"`,
            timestamp: new Date().toISOString()
        }]
      };
      
      setCaseState(newCaseState);
      
      // Save initial state to localStorage
      storage.saveConversation(newCaseState.messages, newCaseState);
      
    } catch (error) {
        console.error("Error in generateNewCase:", error);
        // Rethrow the error to be caught by the caller UI
        throw error;
    } finally {
        setIsGeneratingCase(false);
    }
  }, [userCountry]);

  const generatePracticeCase = useCallback(async (department: Department, condition: string, difficulty: DifficultyLevel = 'standard') => {
    setIsGeneratingCase(true);
    try {
      const newCase = await retryWithBackoff(
        () => generatePracticeCaseService(department.name, condition, userCountry || undefined),
        3, // 3 retries
        1000, // 1s base delay
        `Generate practice case for ${condition}`
      );
      
      if (!newCase) {
        throw new Error(`Failed to generate a practice case for ${condition} in ${department.name}`);
      }
      
      setCaseState({
        ...initialCaseState,
        department,
        caseDetails: newCase,
        messages: [{
            sender: 'system' as const,
            text: `The patient is here today with the following complaint:\n\n"${newCase.openingLine}"`,
            timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
        console.error("Error in generatePracticeCase:", error);
        // Rethrow the error to be caught by the caller UI
        throw error;
    } finally {
        setIsGeneratingCase(false);
    }
  }, [userCountry]);
  
  const addMessage = useCallback((message: Message) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, messages: [...prev.messages, message] };
      
      // Save to localStorage in background
      if (conversationStorage && caseState.department) {
        conversationStorage.saveConversation(newState.messages, newState);
      }
      
      return newState;
    });
  }, [conversationStorage, caseState.department]);

  const setPreliminaryData = useCallback((diagnosis: string, examinationPlan: string, investigationPlan: string) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, preliminaryDiagnosis: diagnosis, examinationPlan, investigationPlan };
      
      // Save to localStorage in background
      if (conversationStorage) {
        conversationStorage.updateCaseState(newState);
      }
      
      return newState;
    });
  }, [conversationStorage]);

  const setInvestigationResults = useCallback((results: InvestigationResult[]) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, investigationResults: results };
      
      // Save to localStorage in background
      if (conversationStorage) {
        conversationStorage.updateCaseState(newState);
      }
      
      return newState;
    });
  }, [conversationStorage]);

  const setExaminationResults = useCallback((results: ExaminationResult[]) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, examinationResults: results };
      
      // Save to localStorage in background
      if (conversationStorage) {
        conversationStorage.updateCaseState(newState);
      }
      
      return newState;
    });
  }, [conversationStorage]);

  const setFinalData = useCallback((diagnosis: string, plan: string) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, finalDiagnosis: diagnosis, managementPlan: plan };
      
      // Save to localStorage in background
      if (conversationStorage) {
        conversationStorage.updateCaseState(newState);
      }
      
      return newState;
    });
  }, [conversationStorage]);

  const setFeedback = useCallback((feedback: Feedback | ComprehensiveFeedback) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, feedback };
      
      // Save to localStorage in background
      if (conversationStorage) {
        conversationStorage.updateCaseState(newState);
      }
      
      return newState;
    });
  }, [conversationStorage]);

  const resetCase = useCallback(() => {
    setCaseState(initialCaseState);
    setConversationStorage(null);
  }, []);

  // Background save functions
  const saveConversationToDatabase = useCallback(async () => {
    if (!conversationStorage || !userEmail || !caseState.messages.length) return;
    
    const saveOperation = () => fetch('/api/cases/batch-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveConversation',
        userEmail,
        userCountry,
        caseId: conversationStorage['caseId'],
        messages: caseState.messages
      })
    });

    try {
      await retrySaveWithBackoff(saveOperation, 2, 500);
      console.log('Conversation saved to database');
    } catch (error) {
      console.error('Failed to save conversation to database:', error);
    }
  }, [conversationStorage, userEmail, userCountry, caseState.messages]);

  const saveCaseStateToDatabase = useCallback(async () => {
    if (!conversationStorage || !userEmail) return;
    
    const saveOperation = () => fetch('/api/cases/batch-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveCaseState',
        userEmail,
        userCountry,
        caseId: conversationStorage['caseId'],
        caseState: {
          preliminaryDiagnosis: caseState.preliminaryDiagnosis,
          examinationPlan: caseState.examinationPlan,
          investigationPlan: caseState.investigationPlan,
          finalDiagnosis: caseState.finalDiagnosis,
          managementPlan: caseState.managementPlan
        }
      })
    });

    try {
      await retrySaveWithBackoff(saveOperation, 2, 500);
      console.log('Case state saved to database');
    } catch (error) {
      console.error('Failed to save case state to database:', error);
    }
  }, [conversationStorage, userEmail, userCountry, caseState]);

  const saveResultsToDatabase = useCallback(async () => {
    if (!conversationStorage || !userEmail) return;
    
    try {
      const response = await fetch('/api/cases/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveResults',
          userEmail,
          userCountry,
          caseId: conversationStorage['caseId'],
          examinationResults: caseState.examinationResults,
          investigationResults: caseState.investigationResults
        })
      });

      if (response.ok) {
        console.log('Results saved to database');
      }
    } catch (error) {
      console.error('Failed to save results to database:', error);
    }
  }, [conversationStorage, userEmail, userCountry, caseState.examinationResults, caseState.investigationResults]);

  const saveFeedbackToDatabase = useCallback(async () => {
    if (!conversationStorage || !userEmail || !caseState.feedback) return;
    
    try {
      const response = await fetch('/api/cases/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveFeedback',
          userEmail,
          userCountry,
          caseId: conversationStorage['caseId'],
          feedback: caseState.feedback
        })
      });

      if (response.ok) {
        console.log('Feedback saved to database');
        // Clear localStorage after successful save
        conversationStorage.clear();
      }
    } catch (error) {
      console.error('Failed to save feedback to database:', error);
    }
  }, [conversationStorage, userEmail, userCountry, caseState.feedback]);

  const savePatientInfoToDatabase = useCallback(async () => {
    if (!conversationStorage || !userEmail || !caseState.caseDetails) return;
    
    try {
      const response = await fetch('/api/cases/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'savePatientInfo',
          userEmail,
          userCountry,
          caseId: conversationStorage['caseId'],
          patientInfo: {
            diagnosis: caseState.caseDetails.diagnosis,
            primaryInfo: caseState.caseDetails.primaryInfo,
            openingLine: caseState.caseDetails.openingLine,
            patientProfile: caseState.caseDetails.patientProfile,
            pediatricProfile: caseState.caseDetails.pediatricProfile,
            isPediatric: caseState.caseDetails.isPediatric
          }
        })
      });

      if (response.ok) {
        console.log('Patient info saved to database');
      }
    } catch (error) {
      console.error('Failed to save patient info to database:', error);
    }
  }, [conversationStorage, userEmail, userCountry, caseState.caseDetails]);

  // Generic retry mechanism for all operations
  const retryWithBackoff = async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    operationName: string = 'Operation'
  ): Promise<any> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        console.log(`${operationName} succeeded on attempt ${attempt + 1}`);
        return result;
      } catch (error) {
        console.warn(`${operationName} failed on attempt ${attempt + 1}:`, error);
        
        if (attempt === maxRetries) {
          throw error; // Re-throw on final attempt
        }
        
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error(`${operationName} failed after ${maxRetries + 1} attempts`);
  };

  // Retry mechanism for save operations (keeps existing interface)
  const retrySaveWithBackoff = async (
    operation: () => Promise<Response>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<boolean> => {
    try {
      await retryWithBackoff(operation, maxRetries, baseDelay, 'Save operation');
      return true;
    } catch (error) {
      console.error('Save operation failed after all retries:', error);
      return false;
    }
  };

  const saveCompletedCaseToDatabase = useCallback(async (): Promise<boolean> => {
    if (!conversationStorage || !userEmail || !caseState.caseDetails || !caseState.feedback) return false;
    
    const saveOperation = () => fetch('/api/cases/batch-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveCompletedCase',
        userEmail,
        userCountry,
        caseId: conversationStorage['caseId'],
        completedCase: {
          department: caseState.department?.name,
          condition: caseState.caseDetails?.diagnosis || '',
          patientInfo: {
            diagnosis: caseState.caseDetails?.diagnosis || '',
            primaryInfo: caseState.caseDetails?.primaryInfo || '',
            openingLine: caseState.caseDetails?.openingLine || '',
            patientProfile: caseState.caseDetails?.patientProfile,
            pediatricProfile: caseState.caseDetails?.pediatricProfile,
            isPediatric: caseState.caseDetails?.isPediatric || false
          },
          messages: caseState.messages,
          preliminaryDiagnosis: caseState.preliminaryDiagnosis,
          examinationPlan: caseState.examinationPlan,
          investigationPlan: caseState.investigationPlan,
          finalDiagnosis: caseState.finalDiagnosis,
          managementPlan: caseState.managementPlan,
          examinationResults: caseState.examinationResults,
          investigationResults: caseState.investigationResults,
          feedback: caseState.feedback,
          completedAt: new Date().toISOString()
        }
      })
    });

    // Try immediate save first
    const immediateSuccess = await retrySaveWithBackoff(saveOperation, 2, 500);
    if (immediateSuccess) {
      console.log('Completed case saved to database immediately');
      return true;
    }

    // If immediate save fails, queue for background retry
    console.log('Immediate save failed, queuing for background retry...');
    queueBackgroundSave(saveOperation);
    
    // Return true to prevent user from seeing error
    return true;
  }, [conversationStorage, userEmail, userCountry, caseState]);

  // Background save queue
  const backgroundSaveQueue: Array<() => Promise<Response>> = [];
  let isProcessingBackgroundSaves = false;

  const queueBackgroundSave = (saveOperation: () => Promise<Response>) => {
    backgroundSaveQueue.push(saveOperation);
    if (!isProcessingBackgroundSaves) {
      processBackgroundSaves();
    }
  };

  // Persistent storage for failed saves
  const saveFailedOperationToStorage = (saveOperation: () => Promise<Response>, caseData: any) => {
    try {
      const failedSaves = JSON.parse(localStorage.getItem('clerkSmartFailedSaves') || '[]');
      failedSaves.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        caseData,
        retryCount: 0
      });
      localStorage.setItem('clerkSmartFailedSaves', JSON.stringify(failedSaves));
      console.log('Failed save operation stored for later retry');
    } catch (error) {
      console.error('Failed to store failed save operation:', error);
    }
  };

  const processBackgroundSaves = async () => {
    if (isProcessingBackgroundSaves || backgroundSaveQueue.length === 0) return;
    
    isProcessingBackgroundSaves = true;
    console.log(`Processing ${backgroundSaveQueue.length} background saves...`);

    while (backgroundSaveQueue.length > 0) {
      const saveOperation = backgroundSaveQueue.shift();
      if (saveOperation) {
        try {
          const success = await retrySaveWithBackoff(saveOperation, 5, 2000);
          if (success) {
            console.log('Background save succeeded');
          } else {
            console.error('Background save failed after all retries');
            // Store failed operation for later retry
            const caseData = {
              userEmail,
              userCountry,
              caseId: conversationStorage?.['caseId'],
              completedCase: {
                department: caseState.department?.name,
                condition: caseState.caseDetails?.diagnosis,
                // ... other case data
              }
            };
            saveFailedOperationToStorage(saveOperation, caseData);
          }
        } catch (error) {
          console.error('Background save error:', error);
        }
        
        // Add delay between background saves to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    isProcessingBackgroundSaves = false;
    console.log('Background save processing complete');
  };

  // Process any failed saves from previous sessions on app load
  useEffect(() => {
    const processFailedSaves = async () => {
      try {
        const failedSaves = JSON.parse(localStorage.getItem('clerkSmartFailedSaves') || '[]');
        if (failedSaves.length > 0) {
          console.log(`Found ${failedSaves.length} failed saves to retry`);
          
          for (const failedSave of failedSaves) {
            if (failedSave.retryCount < 3) {
              // Reconstruct the save operation
              const saveOperation = () => fetch('/api/cases/batch-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'saveCompletedCase',
                  ...failedSave.caseData
                })
              });

              const success = await retrySaveWithBackoff(saveOperation, 2, 1000);
              if (success) {
                // Remove from failed saves
                const updatedFailedSaves = failedSaves.filter((save: any) => save.id !== failedSave.id);
                localStorage.setItem('clerkSmartFailedSaves', JSON.stringify(updatedFailedSaves));
                console.log('Recovered failed save from previous session');
              } else {
                // Increment retry count
                failedSave.retryCount++;
                localStorage.setItem('clerkSmartFailedSaves', JSON.stringify(failedSaves));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing failed saves:', error);
      }
    };

    if (userEmail) {
      processFailedSaves();
    }
  }, [userEmail]);

  const value = { 
    caseState, 
    isGeneratingCase, 
          userEmail,
          userCountry,
    setUserEmail, 
    setUserCountry, 
    generateNewCase, 
    generateNewCaseWithDifficulty, 
    generatePracticeCase, 
    addMessage, 
    setPreliminaryData, 
    setInvestigationResults, 
    setExaminationResults, 
    setFinalData, 
    setFeedback, 
    resetCase,
    saveConversationToDatabase,
    saveCaseStateToDatabase,
    saveResultsToDatabase,
    saveFeedbackToDatabase,
    savePatientInfoToDatabase,
    saveCompletedCaseToDatabase
  };

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