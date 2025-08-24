import { DifficultyLevel } from '~/types';
import { getLocationPrompt, getDifficultyPrompt } from './case-generation';

// Enhanced input validation for custom cases
export const validateCustomCaseInput = (input: string): { isValid: boolean; error?: string; suggestion?: string } => {
    const trimmedInput = input.trim();
    
    // Length validation (only maximum)
    if (trimmedInput.length > 2000) {
        return {
            isValid: false,
            error: 'Case description is too long',
            suggestion: 'Please keep your description under 2000 characters. Focus on the most relevant medical details.'
        };
    }
    
    // Medical content validation
    const medicalTerms = [
        'pain', 'fever', 'shortness', 'breath', 'headache', 'nausea', 'vomiting',
        'diarrhea', 'constipation', 'cough', 'sore throat', 'rash', 'swelling',
        'bleeding', 'dizziness', 'fatigue', 'weakness', 'numbness', 'tingling',
        'chest', 'abdominal', 'back', 'joint', 'muscle', 'bone', 'heart',
        'lung', 'liver', 'kidney', 'brain', 'blood', 'infection', 'injury'
    ];
    
    const hasMedicalContent = medicalTerms.some(term => 
        trimmedInput.toLowerCase().includes(term)
    );
    
    if (!hasMedicalContent) {
        return {
            isValid: false,
            error: 'Missing medical content',
            suggestion: 'Please include medical symptoms, conditions, or patient details relevant to clinical practice.'
        };
    }
    

    
    return { isValid: true };
};

// Detect if input is a single diagnosis or custom case
export const detectInputType = (input: string): 'diagnosis' | 'custom' => {
    const trimmedInput = input.trim();
    
    // If input is short (< 100 chars) and contains medical terminology, treat as single diagnosis
    if (trimmedInput.length < 100) {
        // Check for medical terminology patterns
        const medicalTerms = [
            'infarction', 'pneumonia', 'eclampsia', 'appendicitis', 'ketoacidosis',
            'sepsis', 'meningitis', 'arthritis', 'diabetes', 'hypertension',
            'cancer', 'tumor', 'fracture', 'trauma', 'infection', 'disease',
            'syndrome', 'disorder', 'failure', 'shock', 'embolism', 'thrombosis'
        ];
        
        const hasMedicalTerms = medicalTerms.some(term => 
            trimmedInput.toLowerCase().includes(term)
        );
        
        if (hasMedicalTerms) {
            return 'diagnosis';
        }
    }
    
    // If input contains patient details, demographics, or longer descriptions, treat as custom case
    const customCaseIndicators = [
        'year-old', 'male', 'female', 'patient', 'presenting', 'complaining',
        'symptoms', 'history', 'pain', 'fever', 'shortness', 'breath',
        'headache', 'nausea', 'vomiting', 'diarrhea', 'constipation'
    ];
    
    const hasCustomIndicators = customCaseIndicators.some(indicator => 
        trimmedInput.toLowerCase().includes(indicator)
    );
    
    if (hasCustomIndicators || trimmedInput.length >= 100) {
        return 'custom';
    }
    
    // Default to diagnosis for short inputs
    return 'diagnosis';
};

// Generate practice case prompt for single diagnosis mode
export const generateSingleDiagnosisPrompt = (
    departmentName: string,
    condition: string,
    userCountry?: string,
    difficulty: string = 'standard',
    timeContext?: string,
    surgicalPrompt?: string,
    pediatricPrompt?: string,
    isPediatric: boolean = false,
    isSurgical: boolean = false
) => {
    const locationPrompt = getLocationPrompt(userCountry);
    const difficultyPrompt = getDifficultyPrompt(difficulty as DifficultyLevel);
    
    return `Generate a realistic and challenging clinical case for a medical student simulation in the '${departmentName}' department.

    ${timeContext ? `${timeContext}\n` : ''}
    ${locationPrompt}
    ${surgicalPrompt ? `${surgicalPrompt}\n` : ''}
    ${pediatricPrompt ? `${pediatricPrompt}\n` : ''}
    
    MANDATORY DIAGNOSIS REQUIREMENT:
    - You MUST generate a case for exactly: "${condition}"
    - The "diagnosis" field in your JSON response MUST be "${condition}" or a very close variation
    - Do NOT generate a case for a different condition
    - Do NOT change the diagnosis to something else
    - The entire case history must support the diagnosis of "${condition}"
    
    CASE REQUIREMENTS:
    - The case should be solvable by a medical student
    - Balance regional authenticity with educational value
    - Create a realistic presentation of "${condition}"${difficultyPrompt ? `\n\n${difficultyPrompt}` : ''}
    ${isPediatric ? '- Age-appropriate presentation and developmental context' : ''}
    ${isSurgical ? '- Focus on surgical intervention and context' : ''}
    
    PATIENT COMMUNICATION GUIDELINES:
    - Patients use lay terms, not medical terminology
    - Medications are described in common terms (e.g., "blood pressure pills", "diabetes medicine")
    - Symptoms are described naturally (e.g., "chest pain", "shortness of breath")
    - Avoid patients using exact drug names or dosages
    - Match communication style to education level and health literacy
    ${isPediatric ? `
    PEDIATRIC SPECIFIC GUIDELINES:
    - For infants (0-12 months): Parent provides most history, child non-verbal
    - For toddlers (1-3 years): Parent provides history, child may use basic words
    - For preschoolers (3-5 years): Parent provides history, child may use simple sentences
    - For school-age (6-12 years): Child can communicate directly, parent supplements
    - For adolescents (13+ years): Child communicates like adult, may want privacy
    - Include developmental milestones appropriate for age
    - Parent communication should reflect their education level and health literacy` : ''}
    
    COMMON DIAGNOSIS VARIATIONS (use these if the exact term doesn't fit):
    - "MI" or "Myocardial Infarction" → use "Myocardial Infarction"
    - "CVA" or "Stroke" → use "Stroke" or "Cerebrovascular Accident"
    - "COPD" → use "Chronic Obstructive Pulmonary Disease"
    - "DM" or "Diabetes" → use "Diabetes Mellitus"
    - "HTN" or "Hypertension" → use "Hypertension"
    - "UTI" → use "Urinary Tract Infection"
    - "PNA" or "Pneumonia" → use "Pneumonia"
    
    The output MUST be a single, perfectly valid JSON object with this exact structure: ${isPediatric ? 
`{"diagnosis": string, "primaryInfo": string, "openingLine": string, "isPediatric": true, "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}, "developmentalStage": string, "communicationLevel": string}}` :
`{"diagnosis": string, "primaryInfo": string, "openingLine": string, "patientProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}}`}.

    - "diagnosis": MUST be "${condition}" or a very close variation (see variations above)
    - "primaryInfo": A detailed clinical history string, formatted with markdown headings. This history is the single source of truth for the AI patient. It MUST include all of the following sections:
        - ## BIODATA ${isPediatric ? '(child age, parent)' : ''}
        - ## Presenting Complaint
        - ## History of Presenting Complaint
        - ## Past Medical and Surgical History
        - ## Drug History
        - ## Family History
        - ## Social History
        - ## Review of Systems
        ${isPediatric ? '- ## Developmental History' : ''}
    - "openingLine": A natural, first-person statement ${isPediatric ? 'from parent/child' : 'from patient'} that initiates the consultation.
    ${isPediatric ? `
    - "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}, "developmentalStage": string, "communicationLevel": string}` : `
    - "patientProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}`}

    REMEMBER: The diagnosis MUST be "${condition}" or a very close variation. Do not generate a case for a different condition.`;
};

// Generate practice case prompt for custom case mode
export const generateCustomCasePrompt = (
    departmentName: string,
    scenario: string,
    userCountry?: string,
    difficulty: string = 'standard',
    timeContext?: string,
    surgicalPrompt?: string,
    pediatricPrompt?: string,
    isPediatric: boolean = false,
    isSurgical: boolean = false
) => {
    const locationPrompt = getLocationPrompt(userCountry);
    const difficultyPrompt = getDifficultyPrompt(difficulty as DifficultyLevel);
    
    return `Generate a structured clinical case based on the following custom case description for a medical student simulation in the '${departmentName}' department.

    ${timeContext ? `${timeContext}\n` : ''}
    ${locationPrompt}
    ${surgicalPrompt ? `${surgicalPrompt}\n` : ''}
    ${pediatricPrompt ? `${pediatricPrompt}\n` : ''}
    
    CUSTOM CASE DESCRIPTION:
    "${scenario}"
    
    MANDATORY CONTEXT PRESERVATION REQUIREMENTS:
    - You MUST use the provided case description as the EXACT foundation
    - The generated case MUST maintain the SAME primary medical context as the provided scenario
    - ALL key symptoms, conditions, and medical details from the provided description MUST be included
    - Do NOT change the core medical scenario or add unrelated conditions
    - Do NOT ignore important details from the provided description
    - The patient's main problem must remain the same as described
    
    CASE STRUCTURE REQUIREMENTS:
    - Expand and structure the case into a complete clinical scenario
    - Ensure the case is solvable by a medical student
    - Balance the provided details with educational value
    - Create a realistic and challenging presentation${difficultyPrompt ? `\n\n${difficultyPrompt}` : ''}
    ${isPediatric ? '- Age-appropriate presentation and developmental context' : ''}
    ${isSurgical ? '- Focus on surgical intervention and context' : ''}
    
    PATIENT COMMUNICATION GUIDELINES:
    - Patients use lay terms, not medical terminology
    - Medications are described in common terms (e.g., "blood pressure pills", "diabetes medicine")
    - Symptoms are described naturally (e.g., "chest pain", "shortness of breath")
    - Avoid patients using exact drug names or dosages
    - Match communication style to education level and health literacy
    ${isPediatric ? `
    PEDIATRIC SPECIFIC GUIDELINES:
    - For infants (0-12 months): Parent provides most history, child non-verbal
    - For toddlers (1-3 years): Parent provides history, child may use basic words
    - For preschoolers (3-5 years): Parent provides history, child may use simple sentences
    - For school-age (6-12 years): Child can communicate directly, parent supplements
    - For adolescents (13+ years): Child communicates like adult, may want privacy
    - Include developmental milestones appropriate for age
    - Parent communication should reflect their education level and health literacy` : ''}
    
    CONTEXT MATCHING GUIDELINES:
    - If the scenario mentions chest pain → the case must involve chest pain
    - If the scenario mentions fever → the case must involve fever
    - If the scenario mentions abdominal pain → the case must involve abdominal pain
    - If the scenario mentions specific conditions → those conditions must be central to the case
    - If the scenario mentions specific symptoms → those symptoms must be prominent in the case
    
    The output MUST be a single, perfectly valid JSON object with this exact structure: ${isPediatric ? 
`{"diagnosis": string, "primaryInfo": string, "openingLine": string, "isPediatric": true, "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}, "developmentalStage": string, "communicationLevel": string}}` :
`{"diagnosis": string, "primaryInfo": string, "openingLine": string, "patientProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}}`}.

    - "diagnosis": The most likely diagnosis based on the provided case description (must align with the scenario)
    - "primaryInfo": A detailed clinical history string, formatted with markdown headings. This history is the single source of truth for the AI patient. It MUST include all of the following sections:
        - ## BIODATA ${isPediatric ? '(child age, parent)' : ''}
        - ## Presenting Complaint
        - ## History of Presenting Complaint
        - ## Past Medical and Surgical History
        - ## Drug History
        - ## Family History
        - ## Social History
        - ## Review of Systems
        ${isPediatric ? '- ## Developmental History' : ''}
    - "openingLine": A natural, first-person statement ${isPediatric ? 'from parent/child' : 'from patient'} that initiates the consultation.
    ${isPediatric ? `
    - "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}, "developmentalStage": string, "communicationLevel": string}` : `
    - "patientProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}`}

    REMEMBER: The generated case MUST closely match the medical context of the provided scenario. Do not deviate from the core medical problem described.`;
};

// Main function to generate practice case prompt
export const generatePracticeCasePrompt = (
    departmentName: string,
    practiceCondition: string,
    userCountry?: string,
    difficulty: string = 'standard',
    timeContext?: string,
    surgicalPrompt?: string,
    pediatricPrompt?: string,
    isPediatric: boolean = false,
    isSurgical: boolean = false
) => {
    const inputType = detectInputType(practiceCondition);
    
    if (inputType === 'diagnosis') {
        return generateSingleDiagnosisPrompt(
            departmentName, 
            practiceCondition, 
            userCountry, 
            difficulty,
            timeContext,
            surgicalPrompt,
            pediatricPrompt,
            isPediatric,
            isSurgical
        );
    } else {
        return generateCustomCasePrompt(
            departmentName, 
            practiceCondition, 
            userCountry, 
            difficulty,
            timeContext,
            surgicalPrompt,
            pediatricPrompt,
            isPediatric,
            isSurgical
        );
    }
};
