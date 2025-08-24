import { 
    Case, 
    CaseState, 
    Feedback, 
    InvestigationResult, 
    Message, 
    DetailedFeedbackReport, 
    ConsultantTeachingNotes, 
    ComprehensiveFeedback,
    PatientProfile, 
    ExaminationResult, 
    DifficultyLevel,
    PatientResponse 
} from '../../types';

// Utility functions for context optimization
const containsMedicalTerms = (text: string): boolean => {
    const medicalTerms = [
        'pain', 'symptom', 'diagnosis', 'treatment', 'medication', 'history', 'examination',
        'test', 'result', 'blood', 'pressure', 'temperature', 'heart', 'lung', 'chest',
        'abdomen', 'head', 'neck', 'back', 'fever', 'cough', 'breath', 'nausea', 'vomit',
        'diarrhea', 'constipation', 'urine', 'bleeding', 'swelling', 'rash', 'infection'
    ];
    const lowerText = text.toLowerCase();
    return medicalTerms.some(term => lowerText.includes(term));
};

const optimizeContext = (history: Message[], caseDetails: Case) => {
    // For very long conversations, create a summary
    const conversationSummary = summarizeConversation(history);
    
    // Keep last 15 messages for immediate context
    const recentMessages = history.slice(-15);
    
    const essentialInfo = {
        diagnosis: caseDetails.diagnosis,
        keySymptoms: caseDetails.primaryInfo?.split('\n').slice(0, 3).join('\n') || '',
        patientAge: caseDetails.pediatricProfile?.patientAge || 'adult',
        department: '', // Will be passed separately from caseState
        conversationSummary
    };
    
    // Filter messages to keep important ones, but prioritize recent ones
    const filteredMessages = history.filter(msg => {
        if (msg.sender === 'system') return true;
        if (history.indexOf(msg) >= history.length - 10) return true;
        return containsMedicalTerms(msg.text);
    });
    
    return { 
        recentMessages: filteredMessages.length > 15 ? filteredMessages.slice(-15) : filteredMessages,
        essentialInfo
    };
};

const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error instanceof Error && 
                (error.message.includes('429') || error.message.includes('rate limit')) && 
                i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000;
                console.log(`Rate limited, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
};

// Simple conversation summarization for very long sessions
const summarizeConversation = (messages: Message[]): string => {
    if (messages.length <= 20) return '';
    
    const medicalMessages = messages
        .filter(msg => msg.sender !== 'system' && containsMedicalTerms(msg.text))
        .slice(0, 10); // Take first 10 medical messages
    
    if (medicalMessages.length === 0) return '';
    
    const summary = medicalMessages
        .map(msg => `${msg.sender}: ${msg.text.substring(0, 100)}...`)
        .join('\n');
    
    return `Previous conversation summary:\n${summary}\n\n--- Current conversation continues ---\n`;
};

const handleApiError = async (response: Response, context: string) => {
    let errorData: any = null;
    let errorText = 'Unknown error';
    
    try {
        // Try to parse as JSON first
        errorData = await response.json();
        console.error(`Error in ${context}:`, errorData);
        
        if (errorData.error) {
            errorText = errorData.error;
        } else if (errorData.message) {
            errorText = errorData.message;
        }
    } catch (parseError) {
        // If JSON parsing fails, try to get text
        try {
            errorText = await response.text();
        } catch (textError) {
            console.error('Failed to parse error response:', textError);
        }
    }
    
    throw new Error(`${context}: ${errorText}`);
};

// Generic API call function for the new cache-based backend
const fetchFromApi = async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
        await handleApiError(response, endpoint);
    }

    return response.json();
};

// Function to validate session and get session info for case resumption
export const validateCaseSession = async (caseId: string): Promise<{ isValid: boolean; sessionId?: string }> => {
    try {
        const response = await fetch('/api/sessions/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ caseId }),
            credentials: 'include',
        });

        if (!response.ok) {
            return { isValid: false };
        }

        const result = await response.json();
        return { 
            isValid: result.isValid === true,
            sessionId: result.sessionId
        };
    } catch (error) {
        console.error('Error validating case session:', error);
        return { isValid: false };
    }
};

// Function to get active cases for the user
export const getActiveCases = async (): Promise<Array<{ id: string; sessionId: string; department: { name: string }; openingLine: string; difficultyLevel: string; isPediatric: boolean; createdAt: string; updatedAt: string }>> => {
    try {
        const response = await fetch('/api/sessions', {
            method: 'GET',
            credentials: 'include', // Include cookies for session
        });

        if (!response.ok) {
            await handleApiError(response, 'getActiveCases');
        }

        const result = await response.json();
        return result.cases || [];
    } catch (error) {
        console.error('Error getting active cases:', error);
        return [];
    }
};

// Function to complete a case with session validation
export const completeCase = async (caseData: {
    finalDiagnosis: string;
    managementPlan: string;
    examinationResults: any[];
    investigationResults: any[];
    messages: any[];
    preliminaryDiagnosis?: string;
    examinationPlan?: string;
    investigationPlan?: string;
    makeVisible?: boolean;
    caseId?: string;
    sessionId?: string;
}): Promise<{ success: boolean; feedback: any; caseReport: any; caseId?: string }> => {
    try {
        const response = await fetch('/api/cases/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...caseData,
                caseId: caseData.caseId,
                sessionId: caseData.sessionId
            }),
            credentials: 'include', // Include cookies for session
        });

        if (!response.ok) {
            await handleApiError(response, 'completeCase');
        }

        const result = await response.json();
        return {
            success: result.success,
            feedback: result.feedback,
            caseReport: result.caseReport || null, // Case report may be null if generated in background
            caseId: result.caseId // Include the case ID from the API response
        };
    } catch (error) {
        console.error('Error completing case:', error);
        throw error;
    }
};

// Function to get saved cases for the user
export const getSavedCases = async (): Promise<Array<{
    id: string;
    department: string;
    diagnosis: string;
    completedAt: Date;
    isVisible: boolean;
    caseReport?: any;
}>> => {
    try {
        const response = await fetch('/api/cases/saved', {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            await handleApiError(response, 'getSavedCases');
        }

        const result = await response.json();
        return result.cases || [];
    } catch (error) {
        console.error('Error getting saved cases:', error);
        return [];
    }
};

// Function to update case visibility
export const updateCaseVisibility = async (caseId: string, isVisible: boolean): Promise<boolean> => {
    try {
        const response = await fetch('/api/cases/visibility', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ caseId, isVisible }),
            credentials: 'include',
        });

        if (!response.ok) {
            await handleApiError(response, 'updateCaseVisibility');
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error updating case visibility:', error);
        return false;
    }
};

export const generateClinicalCase = async (departmentName: string, userCountry?: string): Promise<Case> => {
    // Default to standard difficulty for backward compatibility
    return generateClinicalCaseWithDifficulty(departmentName, 'standard', userCountry);
};

export const generateClinicalCaseWithDifficulty = async (departmentName: string, difficulty: DifficultyLevel, userCountry?: string): Promise<Case> => {
            const response = await fetch('/api/ai/generate-case', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                departmentName, 
                difficulty, 
                userCountry 
            }),
            credentials: 'include', // Include cookies for session
        });

    if (!response.ok) {
        await handleApiError(response, 'generateClinicalCaseWithDifficulty');
    }

    const clinicalCase = await response.json();
    
    if (clinicalCase && typeof clinicalCase.primaryInfo === 'string') {
        // The backend now handles all case generation including profiles
        // The session is automatically created by the backend
        return clinicalCase;
    }
    
    throw new Error("The server returned an invalid case format.");
};

export const generatePracticeCase = async (departmentName: string, condition: string, difficulty: DifficultyLevel = 'standard', userCountry?: string): Promise<Case> => {
    const response = await fetch('/api/practice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentName, condition, difficulty, userCountry }),
    });

    if (!response.ok) {
        await handleApiError(response, 'generatePracticeCase');
    }

    const practiceCase = await response.json();
    if (practiceCase && typeof practiceCase.primaryInfo === 'string') {
        // Generate a random patient profile for practice cases too
        const patientProfile = await fetchFromApi('generatePatientProfile', { 
            diagnosis: practiceCase.diagnosis,
            departmentName,
            userCountry,
            randomSeed: Math.floor(Math.random() * 10000)
        });
        return { ...practiceCase, patientProfile };
    }
    throw new Error("The server returned an invalid case format.");
};

export const getPatientResponse = async (
    history: Message[], 
    userCountry?: string,
    caseId?: string,
    sessionId?: string
): Promise<{ messages: { response: string; sender: 'patient' | 'parent'; speakerLabel: string }[] }> => {
    // Keep last 15 messages for immediate context (API will handle further optimization)
    const recentMessages = history.slice(-15);

    const responseData = await fetchFromApi<{ messages: { response: string; sender: 'patient' | 'parent'; speakerLabel: string }[] }>('patient-response', {
        history: recentMessages,
        userCountry,
        caseId,
        sessionId
    });

    // The API now always returns a messages array format
    if (responseData && typeof responseData === 'object' && responseData.messages && Array.isArray(responseData.messages)) {
        return responseData;
    }

    throw new Error("Invalid response format from patient response API");
};

export const getInvestigationResults = async (plan: string, caseId?: string, sessionId?: string): Promise<InvestigationResult[]> => {
    const results = await fetchFromApi<InvestigationResult[]>('investigation-results', { 
        plan,
        caseId,
        sessionId
    });
    return results;
};

export const getExaminationResults = async (plan: string, caseId?: string, sessionId?: string): Promise<ExaminationResult[]> => {
    const results = await fetchFromApi<ExaminationResult[]>('examination-results', { 
        plan,
        caseId,
        sessionId
    });
    return results;
};

export const getCaseFeedback = async (caseState: CaseState): Promise<Feedback | null> => {
    // For the new cache-based system, we don't need to optimize context here
    // The API will handle context optimization using the session middleware
    const feedback = await fetchFromApi<Feedback>('feedback', { 
        caseId: caseState.caseId,
        sessionId: caseState.sessionId,
        caseState: {
            ...caseState,
            messages: caseState.messages.slice(-15) // Keep last 15 messages
        }
    });
    
    return feedback;
};

export const getDetailedCaseFeedback = async (caseState: CaseState): Promise<ConsultantTeachingNotes | null> => {
    try {
        // Validate caseState before making the API call
        if (!caseState.department || !caseState.caseId) {
            throw new Error('Missing required case data for detailed feedback');
        }
        
        const feedback = await fetchFromApi('detailed-feedback', { 
            caseId: caseState.caseId,
            sessionId: caseState.sessionId,
            caseState: {
                ...caseState,
                messages: caseState.messages.slice(-15) // Keep last 15 messages
            }
        });
        
        // Validate the response structure
        if (!feedback || typeof feedback !== 'object') {
            throw new Error('Invalid response format from detailed feedback API');
        }
        
        const requiredFields = ['diagnosis', 'keyLearningPoint', 'clerkingStructure', 'missedOpportunities', 'clinicalReasoning', 'communicationNotes', 'clinicalPearls'];
        const missingFields = requiredFields.filter(field => !(field in feedback));
        
        if (missingFields.length > 0) {
            throw new Error(`Response missing required fields: ${missingFields.join(', ')}`);
        }
        
        return feedback as ConsultantTeachingNotes;
    } catch (error) {
        console.error('Error in getDetailedCaseFeedback:', error);
        throw error;
    }
};

export const getComprehensiveCaseFeedback = async (caseState: CaseState): Promise<ComprehensiveFeedback | null> => {
    try {
        // Validate caseState before making the API call
        if (!caseState.department || !caseState.caseId) {
            throw new Error('Missing required case data for comprehensive feedback');
        }
        
        const feedback = await fetchFromApi('comprehensive-feedback', { 
            caseId: caseState.caseId,
            sessionId: caseState.sessionId,
            caseState: {
                ...caseState,
                messages: caseState.messages.slice(-15) // Keep last 15 messages
            }
        });
        
        // Validate the response structure
        if (!feedback || typeof feedback !== 'object') {
            throw new Error('Invalid response format from comprehensive feedback API');
        }
        
        const requiredFields = ['diagnosis', 'keyLearningPoint', 'whatYouDidWell', 'clinicalReasoning', 'clinicalOpportunities', 'clinicalPearls'];
        const missingFields = requiredFields.filter(field => !(field in feedback));
        
        if (missingFields.length > 0) {
            throw new Error(`Response missing required fields: ${missingFields.join(', ')}`);
        }
        
        return feedback as ComprehensiveFeedback;
    } catch (error) {
        console.error('Error in getComprehensiveCaseFeedback:', error);
        throw error;
    }
};
