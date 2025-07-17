import { Case, CaseState, Feedback, InvestigationResult, Message, DetailedFeedbackReport, ConsultantTeachingNotes, PatientProfile } from '../types';

const handleApiError = async (response: Response, context: string) => {
    // Attempt to parse error JSON from the serverless function
    try {
        const errorData = await response.json();
        console.error(`Error in ${context}:`, errorData);
        // Use the specific error message from the backend if available
        const errorMessage = errorData.error || `An error occurred while trying to ${context}. Please try again.`;
        // Propagate the custom quota error message
        if (errorMessage.startsWith('QUOTA_EXCEEDED')) {
            throw new Error(errorMessage);
        }
        throw new Error(errorMessage);
    } catch (e) {
        // Fallback for non-JSON responses or other parsing errors
        console.error(`An unexpected error occurred in ${context}. Status: ${response.status}`, e);
        throw new Error(`A server error occurred. Please try again.`);
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

export const getPatientResponse = async (history: Message[], caseDetails: Case): Promise<string | { response: string; sender: 'patient' | 'parent'; speakerLabel: string }> => {
    const responseData = await fetchFromApi('getPatientResponse', { history, caseDetails });
    
    // Handle both old format (string) and new format (object with speaker info)
    if (typeof responseData === 'string') {
        return responseData;
    } else if (responseData && typeof responseData === 'object') {
        return {
            response: responseData.response || '',
            sender: responseData.sender || 'patient',
            speakerLabel: responseData.speakerLabel || ''
        };
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
