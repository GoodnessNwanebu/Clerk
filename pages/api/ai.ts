import type { NextApiRequest, NextApiResponse } from 'next';
import { createAIClient } from '../../services/ai-wrapper';
import { Case, CaseState, Feedback, InvestigationResult, Message, DetailedFeedbackReport } from '../../types';

// Ensure the API key is available in the server environment
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set for the serverless function.");
}

const ai = createAIClient(process.env.GEMINI_API_KEY);
const MODEL = 'gemini-2.5-flash';


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

// --- Centralized API Error Handler ---
const handleApiError = (error: unknown, res: NextApiResponse, context: string) => {
    console.error(`Error in ${context}:`, error);
    if (error instanceof Error && (error.message.includes('quota') || error.message.includes('429') || error.message.includes('resource has been exhausted'))) {
        return res.status(429).json({ error: "QUOTA_EXCEEDED: The application's daily usage limit has been reached. Please try again tomorrow." });
    }
    const message = error instanceof Error ? error.message : `An unknown error occurred in ${context}.`;
    return res.status(500).json({ error: message });
};


// --- Handler Functions using Gemini ---

async function handleGenerateCase(payload: { departmentName: string }, res: NextApiResponse) {
    const { departmentName } = payload;
    const context = 'generateClinicalCase';
    const userMessage = `Generate a realistic and challenging clinical case for a medical student simulation in the '${departmentName}' department.
    The output MUST be a single, perfectly valid JSON object with this exact structure: {"diagnosis": string, "primaryInfo": string, "openingLine": string}.

    - "diagnosis": The most likely diagnosis for the case.
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

    Generate a classic, common case for the given department. For example, for Obstetrics, consider Iron Deficiency Anemia or Gestational Diabetes. For Pediatrics, consider Asthma or Gastroenteritis. For Gynecology, consider PCOS or Endometriosis. The case should be solvable by a medical student.`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const text = response.text;
        const caseJson = parseJsonResponse<Case>(text, context);
        return res.status(200).json(caseJson);
    } catch (error) {
        return handleApiError(error, res, context);
    }
}

async function handleGetPatientResponse(payload: { history: Message[], caseDetails: Case }, res: NextApiResponse) {
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
        
        return res.status(200).json({ response: response.text });
    } catch (error) {
        return handleApiError(error, res, context);
    }
}

async function handleGetInvestigationResults(payload: { plan: string, caseDetails: Case }, res: NextApiResponse) {
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
        return res.status(200).json(jsonResponse.results || []);
    } catch (error) {
        return handleApiError(error, res, context);
    }
}

async function handleGetFeedback(payload: { caseState: CaseState }, res: NextApiResponse) {
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
        return res.status(200).json(feedback);
    } catch (error) {
        return handleApiError(error, res, context);
    }
}

async function handleGetDetailedFeedback(payload: { caseState: CaseState }, res: NextApiResponse) {
    const { caseState } = payload;
    const context = 'getDetailedCaseFeedback';
    const userMessage = `
    You are a senior medical educator providing an in-depth, written report for a student after a simulated clinical encounter.
    You must analyze the entire conversation transcript and the student's final assessment.
    Provide a detailed report in a perfectly valid JSON object with the exact structure defined below.
    
    The required JSON structure is:
    {
      "diagnosis": string,
      "keyTakeaway": string,
      "whatYouDidWell": string[],
      "whatCouldBeImproved": string[],
      "clinicalTip": string,
      "positiveQuotes": { "quote": string, "explanation": string }[],
      "improvementQuotes": { "quote": string, "explanation": string }[]
    }

    Instructions for generation:
    - "diagnosis", "keyTakeaway", etc. should be consistent with the initial summary feedback.
    - "positiveQuotes": Find 1-2 specific moments in the transcript where the student excelled. The "quote" must be a direct excerpt from the student's dialogue. The "explanation" should praise the specific technique used (e.g., "Excellent use of an open-ended question to explore the symptom further.").
    - "improvementQuotes": Find 1-2 specific moments where the student could have done better. The "quote" must be from the student's dialogue leading up to the missed opportunity. The "explanation" must describe the missed opportunity or a better way to phrase the question (e.g., "After the patient mentioned XYZ, a more targeted follow-up on red flag symptoms was warranted here.").
    
    Case data to analyze:
    - Department: ${caseState.department!.name}
    - Correct Diagnosis: ${caseState.caseDetails!.diagnosis}
    - Conversation Transcript: ${JSON.stringify(caseState.messages.filter(m => m.sender === 'student' || m.sender === 'patient'))}
    - Student's Final Diagnosis: ${caseState.finalDiagnosis}
    - Student's Management Plan: ${caseState.managementPlan}`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const feedback = parseJsonResponse<DetailedFeedbackReport>(response.text, context);
        return res.status(200).json(feedback);
    } catch (error) {
        return handleApiError(error, res, context);
    }
}


// --- Main Handler ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { type, payload } = req.body;

    switch (type) {
        case 'generateCase':
            return handleGenerateCase(payload, res);
        case 'getPatientResponse':
            return handleGetPatientResponse(payload, res);
        case 'getInvestigationResults':
            return handleGetInvestigationResults(payload, res);
        case 'getFeedback':
            return handleGetFeedback(payload, res);
        case 'getDetailedFeedback':
            return handleGetDetailedFeedback(payload, res);
        default:
            return res.status(400).json({ error: 'Invalid request type' });
    }
}
