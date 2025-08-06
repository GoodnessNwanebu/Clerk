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

export async function POST(request: NextRequest) {
    try {
        const { departmentName, condition, difficulty = 'standard', userCountry } = await request.json();
        
        if (!departmentName || !condition) {
            return NextResponse.json({ error: 'Department name and condition are required' }, { status: 400 });
        }

        const context = 'generatePracticeCase';
        
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

        const userMessage = `Generate a realistic and challenging clinical case for a medical student simulation in the '${departmentName}' department.
        
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

        try {
            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            const practiceCase = parseJsonResponse<Case>(response.text, context);
            return NextResponse.json(practiceCase);
        } catch (error) {
            return handleApiError(error as ApiError, context);
        }
    } catch (error) {
        console.error('Error parsing request:', error);
        return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
} 