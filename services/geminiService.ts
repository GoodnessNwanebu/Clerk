import { Case, CaseState, Feedback, InvestigationResult, Message, DetailedFeedbackReport, ConsultantTeachingNotes, PatientProfile } from '../types';

const handleApiError = async (response: Response, context: string) => {
    let errorData: any = null;
    let errorText = 'Unknown error';
    
    try {
        // Try to parse as JSON first
        errorData = await response.json();
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
        // If JSON parsing failed, try to get the response as text
        if (e instanceof Error && e.message.startsWith('QUOTA_EXCEEDED')) {
            throw e; // Re-throw quota errors
        }
        
        // If JSON parsing failed, the response body is still available for text reading
        if (!errorData) {
            try {
                errorText = await response.text();
            } catch (textError) {
                console.error('Could not read response as text:', textError);
            }
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
    try {
        // Ensure we have a proper base URL for server-side calls
        const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
        const url = `${baseUrl}/api/ai`;
        
        console.log(`Making API call to: ${url}`);
        
        const response = await fetch(url, {
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
        
        // Try to parse the response as JSON
        try {
            const data = await response.json();
            return data;
        } catch (jsonError) {
            console.error(`Failed to parse JSON response for ${type}:`, jsonError);
            throw new Error(`Invalid response format from ${type} API`);
        }
    } catch (error) {
        // If it's already an Error object, re-throw it
        if (error instanceof Error) {
            throw error;
        }
        
        // Otherwise, wrap it in an Error
        throw new Error(`Network error while calling ${type} API`);
    }
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

export const getPatientResponse = async (history: Message[], caseDetails: Case, userCountry?: string): Promise<{ messages: { response: string; sender: 'patient' | 'parent'; speakerLabel: string }[] }> => {
    const responseData = await fetchFromApi('getPatientResponse', { history, caseDetails, userCountry });
    
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
    try {
        // Validate caseState before making the API call
        if (!caseState.department || !caseState.caseDetails) {
            throw new Error('Missing required case data for detailed feedback');
        }
        
        const feedback = await fetchFromApi('getDetailedFeedback', { caseState });
        
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
