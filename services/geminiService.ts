import { Case, CaseState, Feedback, InvestigationResult, Message, DetailedFeedbackReport, ConsultantTeachingNotes, PatientProfile } from '../types';

const handleApiError = async (response: Response, context: string) => {
    try {
        // First try to parse as JSON
        const errorData = await response.json();
        console.error(`Error in ${context}:`, errorData);
        
        // If we have a specific error message from the backend, use it
        if (errorData.error) {
            // Handle quota exceeded errors specially
            if (errorData.error.startsWith('QUOTA_EXCEEDED')) {
                throw new Error(errorData.error);
            }
            throw new Error(errorData.error);
        }
        
        // Fallback error message
        throw new Error(`An error occurred while trying to ${context}. Please try again.`);
    } catch (e) {
        // If we can't parse the error response as JSON, try to get the text
        if (e instanceof Error && e.message.startsWith('QUOTA_EXCEEDED')) {
            throw e; // Re-throw quota errors
        }
        
        // Try to get the response as text
        let errorText = 'Unknown error';
        try {
            errorText = await response.text();
        } catch (textError) {
            console.error('Could not read response as text:', textError);
        }
        
        // Log the raw response for debugging
        console.error(`Failed to parse error response for ${context}:`, {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText,
            originalError: e
        });
        
        // Provide a user-friendly error message based on status code
        if (response.status === 401) {
            throw new Error('API authentication failed. Please check your API key configuration.');
        } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 500) {
            throw new Error('Server error occurred. Please try again later.');
        } else if (response.status >= 400 && response.status < 500) {
            throw new Error(`Request error (${response.status}): ${errorText}`);
        } else {
            throw new Error(`Server error (${response.status}): Please try again later.`);
        }
    }
};

const fetchFromApi = async (type: string, payload: object) => {
    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
        // The handleApiError function will throw, so we don't need to return anything here.
        await handleApiError(response, type);
    }
    return response.json();
};

export const generateClinicalCase = async (departmentName: string, userCountry?: string): Promise<Case> => {
    const clinicalCase = await fetchFromApi('generateCase', { departmentName, userCountry });
    if (clinicalCase && typeof clinicalCase.primaryInfo === 'string') {
        // Check if this is a pediatric case that doesn't already have profiles
        const isPediatric = clinicalCase.isPediatric || departmentName.toLowerCase().includes('pediatric') || departmentName.toLowerCase().includes('paediatric');
        
        if (isPediatric && !clinicalCase.pediatricProfile) {
            // Generate pediatric profile if not present
            const pediatricProfile = await fetchFromApi('generatePediatricProfile', { 
                diagnosis: clinicalCase.diagnosis,
                departmentName,
                userCountry
            });
            return { ...clinicalCase, pediatricProfile, isPediatric: true };
        } else if (!isPediatric && !clinicalCase.patientProfile) {
            // Generate regular patient profile for non-pediatric cases
            const patientProfile = await fetchFromApi('generatePatientProfile', { 
                diagnosis: clinicalCase.diagnosis,
                departmentName,
                userCountry
            });
            return { ...clinicalCase, patientProfile };
        }
        
        return clinicalCase;
    }
    throw new Error("The server returned an invalid case format.");
};

export const generatePracticeCase = async (departmentName: string, condition: string, userCountry?: string): Promise<Case> => {
    const response = await fetch('/api/practice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentName, condition, userCountry }),
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
            userCountry
        });
        return { ...practiceCase, patientProfile };
    }
    throw new Error("The server returned an invalid case format.");
};

export const getPatientResponse = async (history: Message[], caseDetails: Case): Promise<{ messages: { response: string; sender: 'patient' | 'parent'; speakerLabel: string }[] }> => {
    const responseData = await fetchFromApi('getPatientResponse', { history, caseDetails });
    
    // The API now always returns a messages array format
    if (responseData && typeof responseData === 'object' && responseData.messages && Array.isArray(responseData.messages)) {
        return responseData;
    }
    
    throw new Error("Invalid response format from patient response API");
};

export const getInvestigationResults = async (plan: string, caseDetails: Case): Promise<InvestigationResult[]> => {
    const results = await fetchFromApi('getInvestigationResults', { plan, caseDetails });
    return results;
};

export const getCaseFeedback = async (caseState: CaseState): Promise<Feedback | null> => {
    const feedback = await fetchFromApi('getFeedback', { caseState });
    return feedback;
};

export const getDetailedCaseFeedback = async (caseState: CaseState): Promise<ConsultantTeachingNotes | null> => {
    const feedback = await fetchFromApi('getDetailedFeedback', { caseState });
    return feedback;
};
