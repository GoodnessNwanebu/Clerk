import { NextRequest, NextResponse } from 'next/server';
import { createAIClient } from '../../../services/ai-wrapper';
import { Case, CaseState, Feedback, InvestigationResult, Message, DetailedFeedbackReport } from '../../../types';

// Ensure the API key is available in the server environment
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set for the serverless function.");
}

const ai = createAIClient(process.env.GEMINI_API_KEY);
const MODEL = 'gemini-2.5-flash';

// Medical education pathophysiology buckets
const MEDICAL_BUCKETS = [
    'Vascular',
    'Infectious/Inflammatory',
    'Neoplastic',
    'Degenerative',
    'Idiopathic/Iatrogenic/Inherited',
    'Congenital',
    'Autoimmune',
    'Trauma/Mechanical',
    'Endocrine/Metabolic',
    'Psychiatric/Functional'
];

// --- Helper to safely parse JSON from Gemini response ---
const parseJsonResponse = <T>(text: string, context: string): T => {
    let jsonStr = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
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

const handleApiError = (error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
        // Handle quota exceeded errors
        if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
            return NextResponse.json({ error: 'QUOTA_EXCEEDED: You have exceeded your daily quota. Please try again tomorrow.' }, { status: 429 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
};

// --- Handler Functions using Gemini ---

async function handleGenerateCase(payload: { departmentName: string; userCountry?: string }) {
    const { departmentName, userCountry } = payload;
    const context = 'generateClinicalCase';
    
    // Randomly select a medical bucket
    const randomBucket = MEDICAL_BUCKETS[Math.floor(Math.random() * MEDICAL_BUCKETS.length)];
    
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
    
    const userMessage = `Generate a realistic and challenging clinical case for a medical student simulation in the '${departmentName}' department.
    
    ${locationPrompt}
    
    REQUIREMENTS:
    - The case MUST fit the pathophysiology category: "${randomBucket}"
    - The case should be solvable by a medical student
    - Balance regional authenticity with educational value
    
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

    - "diagnosis": The most likely diagnosis for the case that fits the "${randomBucket}" category.
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

            Generate a case that fits the "${randomBucket}" pathophysiology category within the ${departmentName} department. The case should be clinically sound and solvable for a medical student.`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const text = response.text;
        const caseJson = parseJsonResponse<Case>(text, context);
        return NextResponse.json(caseJson);
    } catch (error) {
        return handleApiError(error, context);
    }
}

async function handleGetPatientResponse(payload: { history: Message[], caseDetails: Case }) {
    const { history, caseDetails } = payload;
    const context = 'getPatientResponse';
    const systemInstruction = `You are an AI acting as a patient in a medical simulation.
    Your entire identity and medical history are defined by the PRIMARY_INFORMATION provided below.
    - You MUST adhere strictly to this information. Do not contradict it.
    - If the student asks a question not covered in your primary information, invent a plausible detail that is consistent with the overall diagnosis of '${caseDetails.diagnosis}'.
    - Respond naturally, as a real person would. Be concise.
    - NEVER break character. Do not mention that you are an AI. Do not offer a diagnosis. Do not use medical jargon.

    PRIMARY_INFORMATION:
    ${caseDetails.primaryInfo}`;
    
    // Convert the history to a format suitable for the API
    const conversation = history
        .filter(msg => msg.sender === 'student' || msg.sender === 'patient')
        .map(msg => msg.text).join('\n\n');
    
    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ 
                text: `${systemInstruction}\n\nCONVERSATION SO FAR:\n${conversation}\n\nPatient's response:` 
            }],
        });
        
        return NextResponse.json({ response: response.text });
    } catch (error) {
        return handleApiError(error, context);
    }
}

async function handleGetInvestigationResults(payload: { plan: string, caseDetails: Case }) {
    const { plan, caseDetails } = payload;
    const context = 'getInvestigationResults';
    const userMessage = `A medical student has requested investigations for a patient with a likely diagnosis of '${caseDetails.diagnosis}'.
    Parse their free-text plan and return a JSON array of results.
    The JSON schema for each item must be: {"name": string, "value": number, "unit": string, "range": {"low": number, "high": number}, "status": "Normal" | "High" | "Low" | "Critical"}.
    - Generate medically plausible, realistic values consistent with the diagnosis. Some results should be abnormal to create a challenge.
    - FBC should be broken down into Hemoglobin, WBC, Platelets.
    - U&E into Sodium, Potassium, Urea, Creatinine.
    - LFT into Bilirubin, ALT, AST.
    - If a test is mentioned that you cannot simulate, omit it from the final JSON.
    - Respond ONLY with the JSON array inside a root object: e.g. {"results": [...]}.

    The student's plan: "${plan}"`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const jsonResponse = parseJsonResponse<{results: InvestigationResult[]}>(response.text, context);
        return NextResponse.json(jsonResponse.results || []);
    } catch (error) {
        return handleApiError(error, context);
    }
}

async function handleGetFeedback(payload: { caseState: CaseState }) {
    const { caseState } = payload;
    const context = 'getCaseFeedback';
    const userMessage = `You are a senior medical educator. Analyze the student's performance based on the provided case data.
    Provide concise, constructive feedback in a JSON object with this exact structure: {"diagnosis": string, "keyTakeaway": string, "whatYouDidWell": string[], "whatCouldBeImproved": string[], "clinicalTip": string}.
    - "diagnosis" should be the most likely correct diagnosis.
    - "keyTakeaway" should be a single, concise sentence summarizing the most critical point from "whatCouldBeImproved".
    - "whatYouDidWell" should contain 2-3 positive points.
    - "whatCouldBeImproved" should contain 2-3 actionable suggestions.
    - "clinicalTip" should be a single, insightful educational takeaway.

    Case data:
    - Department: ${caseState.department!.name}
    - Correct Diagnosis: ${caseState.caseDetails!.diagnosis}
    - Conversation: ${JSON.stringify(caseState.messages)}
    - Student's Final Diagnosis: ${caseState.finalDiagnosis}
    - Student's Management Plan: ${caseState.managementPlan}`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const feedback = parseJsonResponse<Feedback>(response.text, context);
        return NextResponse.json(feedback);
    } catch (error) {
        return handleApiError(error, context);
    }
}

async function handleGetDetailedFeedback(payload: { caseState: CaseState }) {
    const { caseState } = payload;
    const context = 'getDetailedCaseFeedback';
    const userMessage = `You are a senior medical educator. Generate a comprehensive educational report for this student's clinical case performance.
    The report should be suitable for emailing and provide detailed educational value.
    
    Return a JSON object with this exact structure: {"diagnosis": string, "department": string, "studentDiagnosis": string, "patientSummary": string, "conversationSummary": string, "clinicalReasoning": string, "investigationAnalysis": string, "managementReview": string, "keyLearningPoints": string[], "areasForImprovement": string[], "recommendations": string[], "educationalResources": string[]}.
    
    Case data:
    - Department: ${caseState.department!.name}
    - Correct Diagnosis: ${caseState.caseDetails!.diagnosis}
    - Patient Details: ${caseState.caseDetails!.primaryInfo}
    - Conversation: ${JSON.stringify(caseState.messages)}
    - Student's Final Diagnosis: ${caseState.finalDiagnosis}
    - Student's Management Plan: ${caseState.managementPlan}
    - Investigation Results: ${JSON.stringify(caseState.investigationResults)}`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const detailedFeedback = parseJsonResponse<DetailedFeedbackReport>(response.text, context);
        return NextResponse.json(detailedFeedback);
    } catch (error) {
        return handleApiError(error, context);
    }
}

// --- Main Handler ---
export async function POST(request: NextRequest) {
    try {
        const { type, payload } = await request.json();

        switch (type) {
            case 'generateCase':
                return await handleGenerateCase(payload);
            case 'getPatientResponse':
                return await handleGetPatientResponse(payload);
            case 'getInvestigationResults':
                return await handleGetInvestigationResults(payload);
            case 'getFeedback':
                return await handleGetFeedback(payload);
            case 'getDetailedFeedback':
                return await handleGetDetailedFeedback(payload);
            default:
                return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
        }
  } catch (error) {
        console.error('Error parsing request:', error);
        return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
  }
} 