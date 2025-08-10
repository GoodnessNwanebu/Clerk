import { NextRequest, NextResponse } from 'next/server';
import { Case } from '../../../types';
import { createAIClient } from '../../../services/ai-wrapper';

// Ensure the API key is available in the server environment
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set for the serverless function.");
}

const ai = createAIClient(process.env.GEMINI_API_KEY);
const MODEL = 'gemini-2.5-flash';

interface ErrorResponse {
    error: string;
    suggestion?: string;
}

interface ApiError extends Error {
    message: string;
    status?: number;
}

const handleApiError = (error: ApiError, context: string): NextResponse<ErrorResponse> => {
    console.error(`Error in ${context}:`, error);
    
    if (error.message && error.message.includes('QUOTA_EXCEEDED')) {
        return NextResponse.json({ error: error.message }, { status: 429 });
    }
    
    return NextResponse.json({ 
        error: `Sorry, we couldn't process your request right now. Please try again.` 
    }, { status: 500 });
};

const parseJsonResponse = <T>(text: string, context: string): T => {
    // Remove any markdown code blocks
    let jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to find JSON object if there's other text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }
    try {
        const parsedData = JSON.parse(jsonStr);
        return parsedData as T;
    } catch (e) {
        console.error(`Failed to parse JSON response for ${context}:`, e);
        console.error("Raw text from AI:", text);
        throw new Error(`The AI returned an invalid format for ${context}.`);
    }
};

// Handle location with general cultural guidance
const getLocationContext = (country: string) => {
    const contexts: { [key: string]: string } = {
        'United States': 'Diverse multicultural society with insurance-based healthcare system. Consider varied ethnic backgrounds and socioeconomic factors.',
        'United Kingdom': 'NHS universal healthcare system. Consider British cultural norms and temperate climate factors.',
        'Canada': 'Multicultural society with universal healthcare. Consider cold climate and diverse cultural backgrounds.',
        'Australia': 'Multicultural society with Medicare system. Consider sun exposure risks and outdoor lifestyle factors.',
        'India': 'Diverse regional cultures with family-oriented social structures. Consider tropical climate and varied socioeconomic conditions.',
        'Nigeria': 'Diverse ethnic groups with extended family structures. Consider tropical diseases and mixed traditional/modern healthcare approaches.',
        'Germany': 'Universal healthcare system with strong social support. Consider temperate climate and industrial society factors.',
        'France': 'Social healthcare system with strong cultural traditions. Consider Mediterranean influences and lifestyle factors.',
        'Japan': 'Aging population with respectful cultural norms. Consider island nation factors and modern lifestyle stresses.',
        'Brazil': 'Diverse cultural heritage with tropical climate. Consider socioeconomic diversity and regional health variations.'
    };
    return contexts[country] || 'local cultural context';
};

// Enhanced input validation for custom cases
const validateCustomCaseInput = (input: string): { isValid: boolean; error?: string; suggestion?: string } => {
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
    
    // Inappropriate content filtering
    const inappropriateTerms = [
        'kill', 'suicide', 'self-harm', 'abuse', 'illegal', 'drugs',
        'weapon', 'violence', 'hate', 'discrimination'
    ];
    
    const hasInappropriateContent = inappropriateTerms.some(term => 
        trimmedInput.toLowerCase().includes(term)
    );
    
    if (hasInappropriateContent) {
        return {
            isValid: false,
            error: 'Inappropriate content detected',
            suggestion: 'Please focus on standard medical scenarios suitable for educational practice.'
        };
    }
    
    return { isValid: true };
};

// Validate AI-generated case for safety and appropriateness
const validateGeneratedCase = (caseData: Case): { isValid: boolean; error?: string } => {
    if (!caseData.diagnosis || !caseData.primaryInfo || !caseData.openingLine) {
        return {
            isValid: false,
            error: 'Generated case is missing required information'
        };
    }
    
    // Check for inappropriate content in generated case
    const inappropriateTerms = [
        'kill', 'suicide', 'self-harm', 'abuse', 'illegal', 'drugs',
        'weapon', 'violence', 'hate', 'discrimination', 'inappropriate'
    ];
    
    const caseText = `${caseData.diagnosis} ${caseData.primaryInfo} ${caseData.openingLine}`.toLowerCase();
    
    const hasInappropriateContent = inappropriateTerms.some(term => 
        caseText.includes(term)
    );
    
    if (hasInappropriateContent) {
        return {
            isValid: false,
            error: 'Generated case contains inappropriate content'
        };
    }
    
    // Validate diagnosis is reasonable
    if (caseData.diagnosis.length < 3 || caseData.diagnosis.length > 100) {
        return {
            isValid: false,
            error: 'Generated diagnosis is invalid'
        };
    }
    
    return { isValid: true };
};

// Detect if input is a single diagnosis or custom case
const detectInputType = (input: string): 'diagnosis' | 'custom' => {
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

export async function POST(request: NextRequest) {
    try {
        const { departmentName, condition, difficulty = 'standard', userCountry } = await request.json();
        
        if (!departmentName || !condition) {
            return NextResponse.json({ 
                error: 'Department name and condition are required',
                suggestion: 'Please select a department and enter a condition or case description.'
            }, { status: 400 });
        }

        const context = 'generatePracticeCase';
        const inputType = detectInputType(condition);
        
        // Validate custom case input
        if (inputType === 'custom') {
            const validation = validateCustomCaseInput(condition);
            if (!validation.isValid) {
                return NextResponse.json({ 
                    error: validation.error!,
                    suggestion: validation.suggestion
                }, { status: 400 });
            }
        }
        
        const locationPrompt = userCountry 
            ? `🌍 LOCATION: ${userCountry}
            
            CULTURAL CONSIDERATIONS:
            - Use culturally authentic names and contexts appropriate to ${userCountry}
            - Consider local healthcare systems and communication styles
            - Be mindful of regional environmental and climatic factors
            - Reflect diverse socioeconomic and cultural backgrounds within the region
            - Consider regionally relevant health risks and lifestyle factors
            - Maintain cultural sensitivity while avoiding stereotypes
            
            LOCATION-SPECIFIC CONTEXT: ${getLocationContext(userCountry)}`
            : `Use culturally diverse names and consider common global disease patterns.`;

        // Add difficulty-specific requirements
        const difficultyPrompt = difficulty === 'standard' ? '' : 
            difficulty === 'intermediate' ? `
INTERMEDIATE DIFFICULTY REQUIREMENTS:
- Include 1-2 relevant comorbidities
- Slightly atypical presentation of the primary diagnosis
- Some conflicting or unclear information
- Multiple possible diagnoses to consider
- Age-related factors affecting presentation
- Medication interactions or side effects
- Social factors influencing care
- Require more detailed history taking and examination` :
            difficulty === 'difficult' ? `
DIFFICULT DIFFICULTY REQUIREMENTS:
- Multiple comorbidities (3+ relevant conditions)
- Highly atypical presentation of the primary diagnosis
- Red herrings and confounding factors
- Complex social determinants of health
- Multiple organ system involvement
- Rare disease presentations or complications
- Complex medication interactions
- Cultural or language barriers
- Require comprehensive assessment and differential diagnosis` : '';

        // Generate different prompts based on input type
        let userMessage: string;
        
        if (inputType === 'diagnosis') {
            // Single diagnosis mode - generate a case around the specified condition
            userMessage = `Generate a realistic and challenging clinical case for a medical student simulation in the '${departmentName}' department.
            
            ${locationPrompt}
            
            REQUIREMENTS:
            - The case MUST be for the condition: "${condition}"
            - The case should be solvable by a medical student
            - Balance regional authenticity with educational value
            - Create a realistic presentation of the specified condition${difficultyPrompt ? `\n\n${difficultyPrompt}` : ''}
            
            EXAMPLES by pathophysiology category:
            - Vascular: Myocardial Infarction, Stroke, Peripheral Vascular Disease
            - Infectious/Inflammatory: Pneumonia, Sepsis, Gastroenteritis, Meningitis
            - Neoplastic: Breast Cancer, Lung Cancer, Lymphoma
            - Degenerative: Osteoarthritis, Alzheimer's Disease, Parkinson's Disease
            - Autoimmune: Rheumatoid Arthritis, SLE, Multiple Sclerosis
            - Trauma/Mechanical: Fractures, Head Trauma, Mechanical Bowel Obstruction
            - Endocrine/Metabolic: Diabetes, Thyroid Disease, Electrolyte Imbalances
            - Psychiatric/Functional: Depression, Anxiety, Functional Disorders
            
            The output MUST be a single, perfectly valid JSON object with this exact structure: {"diagnosis": string, "primaryInfo": string, "openingLine": string}.

            - "diagnosis": The most likely diagnosis for the case (should match or be very close to "${condition}").
            - "primaryInfo": A detailed clinical history string, formatted with markdown headings. This history is the single source of truth for the AI patient. It MUST include all of the following sections:
                - ## BIODATA
                - ## Presenting Complaint
                - ## History of Presenting Complaint
                - ## Past Medical and Surgical History
                - ## Drug History
                - ## Family History
                - ## Social History
                - ## Review of Systems
            - "openingLine": A natural, first-person statement from the patient that initiates the consultation.

            Generate a case for the condition "${condition}" within the ${departmentName} department. The case should be clinically sound and solvable for a medical student.`;
        } else {
            // Custom case mode - use the provided case description to generate a structured case
            userMessage = `Generate a structured clinical case based on the following custom case description for a medical student simulation in the '${departmentName}' department.
            
            ${locationPrompt}
            
            CUSTOM CASE DESCRIPTION:
            "${condition}"
            
            REQUIREMENTS:
            - Use the provided case description as the foundation
            - Expand and structure the case into a complete clinical scenario
            - Ensure the case is solvable by a medical student
            - Balance the provided details with educational value
            - Create a realistic and challenging presentation${difficultyPrompt ? `\n\n${difficultyPrompt}` : ''}
            
            The output MUST be a single, perfectly valid JSON object with this exact structure: {"diagnosis": string, "primaryInfo": string, "openingLine": string}.

            - "diagnosis": The most likely diagnosis based on the provided case description.
            - "primaryInfo": A detailed clinical history string, formatted with markdown headings. This history is the single source of truth for the AI patient. It MUST include all of the following sections:
                - ## BIODATA
                - ## Presenting Complaint
                - ## History of Presenting Complaint
                - ## Past Medical and Surgical History
                - ## Drug History
                - ## Family History
                - ## Social History
                - ## Review of Systems
            - "openingLine": A natural, first-person statement from the patient that initiates the consultation.

            Generate a structured case based on the custom description within the ${departmentName} department. The case should be clinically sound and solvable for a medical student.`;
        }

        try {
            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            const practiceCase = parseJsonResponse<Case>(response.text, context);
            
            // Validate the generated case
            const caseValidation = validateGeneratedCase(practiceCase);
            if (!caseValidation.isValid) {
                console.error('Generated case validation failed:', caseValidation.error);
                
                // For custom cases, try fallback to single diagnosis mode
                if (inputType === 'custom') {
                    const fallbackMessage = `The custom case generation failed. Please try:
1. Simplifying your case description
2. Focusing on specific medical symptoms
3. Using the "Single Diagnosis" mode instead`;
                    
                    return NextResponse.json({ 
                        error: 'Unable to generate a safe case from your description',
                        suggestion: fallbackMessage
                    }, { status: 422 });
                }
                
                throw new Error(caseValidation.error);
            }
            
            return NextResponse.json(practiceCase);
        } catch (error) {
            return handleApiError(error as ApiError, context);
        }
    } catch (error) {
        console.error('Error parsing request:', error);
        return NextResponse.json({ 
            error: 'Invalid request format',
            suggestion: 'Please check your input and try again.'
        }, { status: 400 });
    }
} 