import { NextRequest, NextResponse } from 'next/server';
import { Case } from '../../../types';
import { createAIClient } from '../../../lib/ai/ai-wrapper';

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
const validateGeneratedCase = (caseData: Case): { isValid: boolean; error?: string; suggestion?: string } => {
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
        
        console.log('📋 Practice case generation request:', { departmentName, condition, difficulty, userCountry });
        
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
            
            COMMON DIAGNOSIS VARIATIONS (use these if the exact term doesn't fit):
            - "MI" or "Myocardial Infarction" → use "Myocardial Infarction"
            - "CVA" or "Stroke" → use "Stroke" or "Cerebrovascular Accident"
            - "COPD" → use "Chronic Obstructive Pulmonary Disease"
            - "DM" or "Diabetes" → use "Diabetes Mellitus"
            - "HTN" or "Hypertension" → use "Hypertension"
            - "UTI" → use "Urinary Tract Infection"
            - "PNA" or "Pneumonia" → use "Pneumonia"
            
            The output MUST be a single, perfectly valid JSON object with this exact structure: {"diagnosis": string, "primaryInfo": string, "openingLine": string}.

            - "diagnosis": MUST be "${condition}" or a very close variation (see variations above)
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

            REMEMBER: The diagnosis MUST be "${condition}" or a very close variation. Do not generate a case for a different condition.`;
        } else {
            // Custom case mode - use the provided case description to generate a structured case
            userMessage = `Generate a structured clinical case based on the following custom case description for a medical student simulation in the '${departmentName}' department.
            
            ${locationPrompt}
            
            CUSTOM CASE DESCRIPTION:
            "${condition}"
            
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
            
            CONTEXT MATCHING GUIDELINES:
            - If the scenario mentions chest pain → the case must involve chest pain
            - If the scenario mentions fever → the case must involve fever
            - If the scenario mentions abdominal pain → the case must involve abdominal pain
            - If the scenario mentions specific conditions → those conditions must be central to the case
            - If the scenario mentions specific symptoms → those symptoms must be prominent in the case
            
            The output MUST be a single, perfectly valid JSON object with this exact structure: {"diagnosis": string, "primaryInfo": string, "openingLine": string}.

            - "diagnosis": The most likely diagnosis based on the provided case description (must align with the scenario)
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

            REMEMBER: The generated case MUST closely match the medical context of the provided scenario. Do not deviate from the core medical problem described.`;
        }

        try {
            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            console.log('🤖 AI Response for practice case:', response.text);
            
            const practiceCase = parseJsonResponse<Case>(response.text, context);
            
            console.log('📋 Parsed practice case:', {
                diagnosis: practiceCase.diagnosis,
                hasPrimaryInfo: !!practiceCase.primaryInfo,
                hasOpeningLine: !!practiceCase.openingLine
            });
            
            // Validate the generated case
            const caseValidation = validateGeneratedCase(practiceCase);
            if (!caseValidation.isValid) {
                console.error('Generated case validation failed:', caseValidation.error);
                
                // Try one more time with a more explicit prompt
                try {
                    const retryMessage = userMessage + `\n\nIMPORTANT: The previous attempt failed validation. Please ensure:
- All required sections are present in primaryInfo
- The case is clinically appropriate and educational
- No inappropriate content is included`;

                    const retryResponse = await ai.generateContent({
                        model: MODEL,
                        contents: [{ text: retryMessage }],
                    });
                    
                    const retryCase = parseJsonResponse<Case>(retryResponse.text, context);
                    const retryValidation = validateGeneratedCase(retryCase);
                    
                    if (retryValidation.isValid) {
                        console.log('Retry successful, returning validated case');
                        return NextResponse.json(retryCase);
                    }
                } catch (retryError) {
                    console.error('Retry attempt failed:', retryError);
                }
                
                return NextResponse.json({ 
                    error: caseValidation.error!,
                    suggestion: caseValidation.suggestion || 'Please try again with a different input.'
                }, { status: 422 });
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