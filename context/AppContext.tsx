"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { 
  CaseState, 
  Department, 
  Message, 
  InvestigationResult, 
  ExaminationResult, 
  Feedback, 
  ComprehensiveFeedback,
  DifficultyLevel,
} from "../types";
import {
  generateClinicalCase,
  generateClinicalCaseWithDifficulty,
  generatePracticeCase as generatePracticeCaseService,
  validateCaseSession,
  getActiveCases,
  completeCase,
  getSavedCases,
  updateCaseVisibility,
} from "../lib/ai/geminiService";
import { ConversationStorage } from "../lib/storage/localStorage";
import {
  getCaseFeedback,
  getDetailedCaseFeedback,
  getComprehensiveCaseFeedback,
} from "../lib/ai/geminiService";
import { generateShareData } from "../lib/shared/shareUtils";
import { fetchDepartments, transformDepartmentsForFrontend } from '../lib/services/departmentService';

interface AppContextType {
  caseState: CaseState;
  isGeneratingCase: boolean;
  userEmail: string | null;
  userCountry: string | null;
  navigationEntryPoint: string | null;
  setUserEmail: (email: string) => void;
  setUserCountry: (country: string) => void;
  setNavigationEntryPoint: (entryPoint: string) => void;
  generateNewCase: (department: Department) => Promise<void>;
  generateNewCaseWithDifficulty: (
    department: Department,
    difficulty: DifficultyLevel,
    subspecialty?: string
  ) => Promise<void>;
  generatePracticeCase: (
    department: Department,
    condition: string,
    difficulty?: DifficultyLevel
  ) => Promise<void>;
  resumeCase: (caseId: string) => Promise<boolean>;
  addMessage: (message: Message) => void;
  setPreliminaryData: (
    diagnosis: string,
    examinationPlan: string,
    investigationPlan: string
  ) => void;
  setInvestigationResults: (results: InvestigationResult[]) => void;
  setExaminationResults: (results: ExaminationResult[]) => void;
  setFinalData: (diagnosis: string, plan: string) => void;
  setFeedback: (feedback: Feedback | ComprehensiveFeedback) => void;
  setDepartment: (department: string) => void;
  resetCase: () => void;
  completeCaseWithJWT: (makeVisible?: boolean) => Promise<boolean>;
  completeCaseAndSave: () => Promise<boolean>;
  toggleCaseVisibility: (caseId: string, makeVisible: boolean) => Promise<boolean>;
  
  // Department caching
  departments: Department[];
  isLoadingDepartments: boolean;
  loadDepartments: () => Promise<void>;
  refreshDepartments: () => Promise<void>;
  
  // Saved cases cache management
  addCaseToCache: (caseData: any) => void;
  clearSavedCasesCache: () => void;
}

const initialCaseState: CaseState = {
  department: null,
  caseId: null,
  sessionId: null,
  caseDetails: null, // This will be populated from cache context
  messages: [],
  preliminaryDiagnosis: "",
  examinationPlan: "",
  investigationPlan: "",
  examinationResults: [],
  investigationResults: [],
  finalDiagnosis: "",
  managementPlan: "",
  feedback: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [caseState, setCaseState] = useState<CaseState>(initialCaseState);
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [userEmail, setUserEmailState] = useState<string | null>(null);
  const [userCountry, setUserCountryState] = useState<string | null>(null);
  const [navigationEntryPoint, setNavigationEntryPointState] = useState<
    string | null
  >(null);
  const [conversationStorage, setConversationStorage] =
    useState<ConversationStorage | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const isBrowser = typeof window !== "undefined";
  // Restore case state from localStorage on mount (secondary context only)
  useEffect(() => {
    if (!isBrowser) return;
    
    const restoreCaseFromStorage = async () => {
      try {
    // Try to find the most recent case in localStorage
    const keys = Object.keys(localStorage);
        const caseKeys = keys.filter((key) =>
          key.startsWith("clerksmart_case_")
        );
    
    if (caseKeys.length > 0) {
      // Get the most recent case
      const mostRecentKey = caseKeys.sort().pop()!;
          const caseId = mostRecentKey.replace("clerksmart_case_", "");
          const storage = new ConversationStorage(caseId);
      const savedData = storage.loadConversation();
      
          if (savedData && savedData.conversation.length > 0) {
            // Validate session before restoring
            const sessionValidation = await validateCaseSession(caseId);

            if (sessionValidation.isValid) {
              setConversationStorage(storage);
              setCaseState((prev) => ({
                ...prev,
                caseId,
                sessionId: sessionValidation.sessionId || null,
                messages: savedData.conversation,
                // Restore secondary context from localStorage
                preliminaryDiagnosis: savedData.secondaryContext.preliminaryDiagnosis,
                examinationPlan: savedData.secondaryContext.examinationPlan,
                investigationPlan: savedData.secondaryContext.investigationPlan,
                examinationResults: savedData.secondaryContext.examinationResults,
                investigationResults: savedData.secondaryContext.investigationResults,
                finalDiagnosis: savedData.secondaryContext.finalDiagnosis,
                managementPlan: savedData.secondaryContext.managementPlan,
                feedback: savedData.secondaryContext.feedback,
              }));
              console.log(
                "Case restored from localStorage with valid JWT session"
              );

            } else {
              // JWT session is invalid, but don't clear localStorage automatically
              // This could be due to network issues, server problems, or temporary validation failures
              // Only clear localStorage when user explicitly chooses to start a new simulation
              console.warn("JWT session invalid during app load, but preserving localStorage for potential recovery");
              console.log("User can manually clear localStorage by starting a new simulation");
            }
          }
        }
      } catch (error) {
        console.error("Error restoring case from localStorage:", error);
      }
    };

    restoreCaseFromStorage();
  }, [isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;
    
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setUserEmailState(storedEmail);
    }

    const storedCountry = localStorage.getItem("userCountry");
    if (storedCountry) {
      setUserCountryState(storedCountry);
    }

    const storedEntryPoint = localStorage.getItem("navigationEntryPoint");
    if (storedEntryPoint) {
      setNavigationEntryPointState(storedEntryPoint);
    }
  }, [isBrowser]);

  const setUserEmail = (email: string) => {
    if (isBrowser) {
      localStorage.setItem("userEmail", email);
    }
    setUserEmailState(email);
  };

  const setUserCountry = (country: string) => {
    if (isBrowser) {
      localStorage.setItem("userCountry", country);
    }
    setUserCountryState(country);
  };

  const setNavigationEntryPoint = (entryPoint: string) => {
    if (isBrowser) {
      localStorage.setItem("navigationEntryPoint", entryPoint);
    }
    setNavigationEntryPointState(entryPoint);
  };
  
  const generateNewCase = useCallback(async (department: Department) => {
    // Default to standard difficulty for backward compatibility
    return generateNewCaseWithDifficulty(department, "standard");
  }, []);

  const generateNewCaseWithDifficulty = useCallback(
    async (department: Department, difficulty: DifficultyLevel, subspecialty?: string) => {
    setIsGeneratingCase(true);
    try {
        // Use JWT-based case generation (backend creates session and JWT)
        const response = await fetch('/api/ai/generate-case', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            department: department.name,
            difficulty,
            userCountry: userCountry || undefined,
            subspecialty: subspecialty || undefined
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate a case for ${department.name}`);
        }

        const result = await response.json();
        
        if (!result.success) {
        throw new Error(`Failed to generate a case for ${department.name}`);
      }
      
        // Use the backend caseId for localStorage (secondary context)
      const caseId = result.case.id;
      
        // Initialize localStorage for this case (secondary context only)
      const storage = new ConversationStorage(caseId);
      setConversationStorage(storage);
      
        // Create initial case state with secondary context only
        // Primary context comes from JWT cookies
      const newCaseState = {
        ...initialCaseState,
          department: department.name,
          caseId: result.case.id,
          sessionId: result.case.sessionId,
          caseDetails: null, // Primary context is in cache
          messages: [
            {
              sender: "system" as const,
              text: `The patient is here today with the following complaint:\n\n"${result.case.openingLine}"`,
              timestamp: new Date().toISOString(),
            },
          ],
      };
      
      setCaseState(newCaseState);
      
        // Save initial state to localStorage (secondary context only)
      storage.saveConversation(newCaseState.messages, newCaseState);
    } catch (error) {
        console.error("Error in generateNewCase:", error);
        // Rethrow the error to be caught by the caller UI
        throw error;
    } finally {
        setIsGeneratingCase(false);
    }
    },
    [userCountry]
  );

  const generatePracticeCase = useCallback(
    async (
      department: Department,
      condition: string,
      difficulty: DifficultyLevel = "standard"
    ) => {
    setIsGeneratingCase(true);
    try {
        // Use JWT-based practice case generation (backend creates session and JWT)
        const response = await fetch('/api/ai/generate-case', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            department: department.name,
            difficulty,
            userCountry: userCountry || undefined,
            practiceCondition: condition
          })
        });

        if (!response.ok) {
          throw new Error(
            `Failed to generate a practice case for ${condition} in ${department.name}`
          );
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(
            `Failed to generate a practice case for ${condition} in ${department.name}`
          );
        }

        // Generate a unique case ID for localStorage (secondary context)
      const caseId = `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
        // Initialize localStorage for this case (secondary context only)
      const storage = new ConversationStorage(caseId);
      setConversationStorage(storage);
      
        // Create initial case state with secondary context only
        // Primary context comes from JWT cookies
      const newCaseState = {
        ...initialCaseState,
          department: department.name,
          caseId: result.case.id,
          sessionId: result.case.sessionId,
          caseDetails: null, // Primary context is in cache
          messages: [
            {
              sender: "system" as const,
              text: `The patient is here today with the following complaint:\n\n"${result.case.openingLine}"`,
              timestamp: new Date().toISOString(),
            },
          ],
      };
      
      setCaseState(newCaseState);
      
        // Save initial state to localStorage (secondary context only)
      storage.saveConversation(newCaseState.messages, newCaseState);
    } catch (error) {
        console.error("Error in generatePracticeCase:", error);
        // Rethrow the error to be caught by the caller UI
        throw error;
    } finally {
        setIsGeneratingCase(false);
    }
    },
    [userCountry]
  );
  
  const addMessage = useCallback(
    (message: Message) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, messages: [...prev.messages, message] };
      
      // Save to localStorage in background
      if (conversationStorage && caseState.department) {
        conversationStorage.saveConversation(newState.messages, newState);
      }
      
      return newState;
    });
    },
    [conversationStorage, caseState.department]
  );

  const setPreliminaryData = useCallback(
    (diagnosis: string, examinationPlan: string, investigationPlan: string) => {
    setCaseState((prev: CaseState) => {
        const newState = {
          ...prev,
          preliminaryDiagnosis: diagnosis,
          examinationPlan,
          investigationPlan,
        };

        // Save to localStorage in background (secondary context only)
      if (conversationStorage) {
          conversationStorage.updateSecondaryContext({
            preliminaryDiagnosis: diagnosis,
            examinationPlan,
            investigationPlan,
          });
      }
      
      return newState;
    });
    },
    [conversationStorage]
  );

  const setInvestigationResults = useCallback(
    (results: InvestigationResult[]) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, investigationResults: results };
      
        // Save to localStorage in background (secondary context only)
      if (conversationStorage) {
          conversationStorage.updateSecondaryContext({
            investigationResults: results,
          });
      }
      
      return newState;
    });
    },
    [conversationStorage]
  );

  const setExaminationResults = useCallback(
    (results: ExaminationResult[]) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, examinationResults: results };
      
        // Save to localStorage in background (secondary context only)
      if (conversationStorage) {
          conversationStorage.updateSecondaryContext({
            examinationResults: results,
          });
      }
      
      return newState;
    });
    },
    [conversationStorage]
  );

  const setFinalData = useCallback(
    (diagnosis: string, plan: string) => {
    setCaseState((prev: CaseState) => {
        const newState = {
          ...prev,
          finalDiagnosis: diagnosis,
          managementPlan: plan,
        };

        // Save to localStorage in background (secondary context only)
      if (conversationStorage) {
          conversationStorage.updateSecondaryContext({
            finalDiagnosis: diagnosis,
            managementPlan: plan,
          });
      }
      
      return newState;
    });
    },
    [conversationStorage]
  );

  const setFeedback = useCallback(
    (feedback: Feedback | ComprehensiveFeedback) => {
    setCaseState((prev: CaseState) => {
      const newState = { ...prev, feedback };
      
      // Generate share data immediately when feedback is created
      const shareData = generateShareData(feedback, newState);
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingShareData", JSON.stringify(shareData));
      }
      
        // Save to localStorage in background (secondary context only)
      if (conversationStorage) {
          conversationStorage.updateSecondaryContext({
            feedback,
          });
      }
      
      return newState;
    });
    },
    [conversationStorage]
  );

  const setDepartment = useCallback(
    (department: string) => {
      setCaseState((prev: CaseState) => ({
        ...prev,
        department
      }));
    },
    []
  );

  const resetCase = useCallback(() => {
    setCaseState(initialCaseState);
    setConversationStorage(null);
    setNavigationEntryPoint("");
  }, []);

  // New case completion function that ALWAYS saves to DB and clears localStorage
  const completeCaseAndSave = useCallback(
    async (): Promise<boolean> => {
      if (!caseState.finalDiagnosis || !caseState.managementPlan) {
        console.error(
          "Cannot complete case: missing final diagnosis or management plan"
        );
        return false;
      }

      try {
        console.log("🔄 [AppContext.completeCaseAndSave] Starting case completion...");
        
        // Always save to DB with isVisible = false initially
        const result = await completeCase({
          finalDiagnosis: caseState.finalDiagnosis,
          managementPlan: caseState.managementPlan,
          examinationResults: caseState.examinationResults,
          investigationResults: caseState.investigationResults,
          messages: caseState.messages,
          preliminaryDiagnosis: caseState.preliminaryDiagnosis,
          examinationPlan: caseState.examinationPlan,
          investigationPlan: caseState.investigationPlan,
          makeVisible: false, // Always save, but not visible initially
          caseId: caseState.caseId || undefined,
          sessionId: caseState.sessionId || undefined,
        });

        if (result.success) {
          console.log("✅ [AppContext.completeCaseAndSave] Case completed and saved to DB successfully");
          
          // Set the feedback from the complete API response
          if (result.feedback) {
            console.log("🔄 [AppContext.completeCaseAndSave] Setting feedback from complete API...");
            setFeedback(result.feedback);
            console.log("✅ [AppContext.completeCaseAndSave] Feedback set successfully");
          }

          // Deactivate session after successful completion to prevent resume
          if (caseState.sessionId) {
            try {
              console.log(`🔄 [AppContext.completeCaseAndSave] Deactivating session after completion: ${caseState.sessionId}`);
              await fetch('/api/sessions/invalidate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionId: caseState.sessionId,
                  caseId: caseState.caseId
                }),
                credentials: 'include',
              });
              console.log(`✅ [AppContext.completeCaseAndSave] Session deactivated successfully after completion`);
            } catch (error) {
              console.error('❌ [AppContext.completeCaseAndSave] Error deactivating session after completion:', error);
              // Don't fail the completion if session deactivation fails
            }
          }

          // Clear localStorage after successful completion
          if (conversationStorage) {
            console.log(`🗑️ [AppContext.completeCaseAndSave] Clearing localStorage after case completion for case: ${caseState.caseId}`);
            console.trace('Stack trace for case completion localStorage clear');
            conversationStorage.clear();
            setConversationStorage(null);
            console.log(`✅ [AppContext.completeCaseAndSave] Successfully cleared localStorage after case completion`);
          }

          // Reset case state but preserve feedback and case ID
          setCaseState(prev => ({
            ...initialCaseState,
            caseId: result.caseId || prev.caseId, // Preserve the case ID from API response
            feedback: result.feedback || prev.feedback
          }));

          return true;
        } else {
          console.error("❌ [AppContext.completeCaseAndSave] Case completion failed");
          return false;
        }
      } catch (error) {
        console.error("❌ [AppContext.completeCaseAndSave] Error completing case:", error);
        return false;
      }
    },
    [caseState, conversationStorage]
  );

  // Function to toggle case visibility (for "Save Case" button)
  const toggleCaseVisibility = useCallback(
    async (caseId: string, makeVisible: boolean): Promise<boolean> => {
      try {
        const result = await updateCaseVisibility(caseId, makeVisible);
        return result;
      } catch (error) {
        console.error("Error toggling case visibility:", error);
        return false;
      }
    },
    []
  );

  // Legacy function - now only handles visibility toggling
  const completeCaseWithJWT = useCallback(
    async (makeVisible: boolean = false): Promise<boolean> => {
      if (!caseState.caseId) {
        console.error("Cannot toggle visibility: missing case ID");
        return false;
      }

      try {
        const result = await toggleCaseVisibility(caseState.caseId, makeVisible);
        return result;
      } catch (error) {
        console.error("Error toggling case visibility:", error);
        return false;
      }
    },
    [caseState.caseId, toggleCaseVisibility]
  );

  const resumeCase = useCallback(async (caseId: string) => {
    setIsGeneratingCase(true);
    try {
      const storage = new ConversationStorage(caseId);
      const savedData = storage.loadConversation();
      const sessionValidation = await validateCaseSession(caseId);

      if (savedData && savedData.conversation.length > 0 && sessionValidation.isValid) {
        setConversationStorage(storage);
        setCaseState((prev) => ({
          ...prev,
          caseId,
          sessionId: sessionValidation.sessionId || null,
          department: savedData.department || null, // Restore department from localStorage
          messages: savedData.conversation,
          // Restore secondary context from localStorage
          preliminaryDiagnosis: savedData.secondaryContext.preliminaryDiagnosis,
          examinationPlan: savedData.secondaryContext.examinationPlan,
          investigationPlan: savedData.secondaryContext.investigationPlan,
          examinationResults: savedData.secondaryContext.examinationResults,
          investigationResults: savedData.secondaryContext.investigationResults,
          finalDiagnosis: savedData.secondaryContext.finalDiagnosis,
          managementPlan: savedData.secondaryContext.managementPlan,
          feedback: savedData.secondaryContext.feedback,
        }));
        console.log("Case resumed from localStorage with valid session");
        return true;
              } else {
        console.warn(
          "Case not found or session invalid for resume:",
          caseId
        );
        return false;
        }
      } catch (error) {
      console.error("Error resuming case:", error);
      return false;
    } finally {
      setIsGeneratingCase(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    setIsLoadingDepartments(true);
    try {
      // Try to load from localStorage first
      if (isBrowser) {
        const cachedDepartments = localStorage.getItem('cachedDepartments');
        const cacheTimestamp = localStorage.getItem('cachedDepartmentsTimestamp');
        
        // Check if cache is less than 24 hours old
        if (cachedDepartments && cacheTimestamp) {
          const cacheAge = Date.now() - parseInt(cacheTimestamp);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (cacheAge < maxAge) {
            try {
              const parsedDepartments = JSON.parse(cachedDepartments);
              setDepartments(parsedDepartments);
              setIsLoadingDepartments(false);
              console.log('✅ Loaded departments from cache');
              return;
            } catch (parseError) {
              console.warn('Failed to parse cached departments, fetching fresh data');
            }
          }
        }
      }
      
      // Fetch fresh data from API
      const fetchedDepartments = await fetchDepartments();
      const transformedDepartments = transformDepartmentsForFrontend(fetchedDepartments);
      setDepartments(transformedDepartments);
      
      // Cache the departments
      if (isBrowser) {
        localStorage.setItem('cachedDepartments', JSON.stringify(transformedDepartments));
        localStorage.setItem('cachedDepartmentsTimestamp', Date.now().toString());
        console.log('✅ Cached departments for future use');
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      setDepartments([]); // Clear departments on error
    } finally {
      setIsLoadingDepartments(false);
    }
  }, [isBrowser]);

  const refreshDepartments = useCallback(async () => {
    // Clear cache and force refresh
    if (isBrowser) {
      localStorage.removeItem('cachedDepartments');
      localStorage.removeItem('cachedDepartmentsTimestamp');
    }
    await loadDepartments();
  }, [isBrowser, loadDepartments]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Saved cases cache management functions
  const addCaseToCache = useCallback((caseData: any) => {
    if (!isBrowser) return;
    
    try {
      const cacheKey = 'savedCasesCache';
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { cases: cachedCases, lastFetched } = JSON.parse(cached);
        const updatedCases = [caseData, ...cachedCases];
        
        const cacheData = {
          cases: updatedCases,
          lastFetched: lastFetched || Date.now()
        };
        
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('✅ Added case to saved cases cache');
      }
    } catch (error) {
      console.warn('Failed to add case to saved cases cache:', error);
    }
  }, [isBrowser]);

  const clearSavedCasesCache = useCallback(() => {
    if (!isBrowser) return;
    
    try {
      localStorage.removeItem('savedCasesCache');
      console.log('✅ Cleared saved cases cache');
    } catch (error) {
      console.warn('Failed to clear saved cases cache:', error);
    }
  }, [isBrowser]);

  const value = { 
    caseState, 
    isGeneratingCase, 
          userEmail,
          userCountry,
    setUserEmail, 
    setUserCountry, 
    setNavigationEntryPoint,
    generateNewCase, 
    generateNewCaseWithDifficulty, 
    generatePracticeCase, 
    resumeCase,
    addMessage, 
    setPreliminaryData, 
    setInvestigationResults, 
    setExaminationResults, 
    setFinalData, 
    setFeedback, 
    setDepartment,
    resetCase,
    completeCaseWithJWT,
    completeCaseAndSave,
    toggleCaseVisibility,
    navigationEntryPoint,
    departments,
    isLoadingDepartments,
    loadDepartments,
    refreshDepartments,
    addCaseToCache,
    clearSavedCasesCache,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
