import { NextRequest, NextResponse } from 'next/server';
import { createAIClient } from '../../../services/ai-wrapper';
import { Case, CaseState, Feedback, InvestigationResult, Message, DetailedFeedbackReport, PatientProfile, PatientResponse } from '../../../types';

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
    
    // Remove markdown code blocks if present
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    
    // Remove any leading/trailing non-JSON text
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }
    
    try {
        const parsedData = JSON.parse(jsonStr);
        
        // Validate that we got an object
        if (typeof parsedData !== 'object' || parsedData === null) {
            throw new Error('Response is not a valid JSON object');
        }
        
        return parsedData as T;
    } catch (e) {
        console.error(`Failed to parse JSON response for ${context}:`, e);
        console.error("Raw text from AI:", text);
        console.error("Attempted to parse:", jsonStr);
        
        // Provide more specific error messages
        if (e instanceof SyntaxError) {
            throw new Error(`The AI returned malformed JSON for ${context}. Please try again.`);
        }
        
        throw new Error(`The AI returned an invalid format for ${context}. Please try again.`);
    }
};

const handleApiError = (error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
        // Handle quota exceeded errors
        if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
            return NextResponse.json({ error: 'QUOTA_EXCEEDED: You have exceeded your daily quota. Please try again tomorrow.' }, { status: 429 });
        }
        
        // Handle API key errors
        if (error.message.includes('API key') || error.message.includes('authentication') || error.message.includes('403')) {
            return NextResponse.json({ error: 'API authentication failed. Please check your API key configuration.' }, { status: 401 });
        }
        
        // Handle rate limiting
        if (error.message.includes('rate limit') || error.message.includes('429')) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment and try again.' }, { status: 429 });
        }
        
        // Handle network/connection errors
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ENOTFOUND')) {
            return NextResponse.json({ error: 'Network error. Please check your internet connection and try again.' }, { status: 503 });
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
};

// --- Handler Functions using Gemini ---

async function handleGenerateCase(payload: { departmentName: string; userCountry?: string }) {
    const { departmentName, userCountry } = payload;
    const context = 'generateClinicalCase';
    
    // Check if this is a pediatric case
    const isPediatric = departmentName.toLowerCase().includes('pediatric') || departmentName.toLowerCase().includes('paediatric');
    
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
📍 CONTEXT: Patient is from ${userCountry}, uses ${userCountry} healthcare system, speaks with ${userCountry} cultural norms
🎯 REQUIREMENT: Generate authentic ${userCountry} names, places, and cultural references naturally
        
CULTURAL CONSIDERATIONS:
- Use culturally authentic names and contexts appropriate to ${userCountry}
- Consider local healthcare systems and communication styles
- Be mindful of regional environmental and climatic factors
- Reflect diverse socioeconomic and cultural backgrounds within the region
- Consider regionally relevant health risks and lifestyle factors
- Maintain cultural sensitivity while avoiding stereotypes
        
LOCATION-SPECIFIC CONTEXT: ${getLocationContext(userCountry)}`
        : `Use culturally diverse names and consider common global disease patterns.`;

    // Pediatric-specific prompt additions
    const pediatricPrompt = isPediatric ? `
    
    🧒 PEDIATRIC CASE REQUIREMENTS:
    - Include patient age (specify in months for infants <2 years, years for older children)
    - Specify which parent is accompanying (mother or father)
    - Consider age-appropriate communication levels:
      * Infants (0-12 months): Non-verbal, all history from parent
      * Toddlers (1-3 years): Basic words, mainly parent provides history
      * Preschool (3-5 years): Simple sentences, parent supplements
      * School-age (6-12 years): Good communication, some direct interaction
      * Adolescents (13+ years): Adult-like communication, may want privacy from parents
    - Include developmental milestones relevant to the case
    - Consider family dynamics and parental concerns
    ` : '';
    
    const userMessage = `Generate a realistic and challenging clinical case for a medical student simulation in the '${departmentName}' department.
    
    ${locationPrompt}
    ${pediatricPrompt}
    
    REQUIREMENTS:
    - The case MUST fit the pathophysiology category: "${randomBucket}"
    - The case should be solvable by a medical student
    - Balance regional authenticity with educational value
    ${isPediatric ? '- For pediatric cases, ensure age-appropriate presentation and include developmental context' : ''}
    
    EXAMPLES by pathophysiology category:
    - Vascular: Myocardial Infarction, Stroke, Peripheral Vascular Disease
    - Infectious/Inflammatory: Pneumonia, Sepsis, Gastroenteritis, Meningitis
    - Neoplastic: Breast Cancer, Lung Cancer, Lymphoma
    - Degenerative: Osteoarthritis, Alzheimer's Disease, Parkinson's Disease
    - Autoimmune: Rheumatoid Arthritis, SLE, Multiple Sclerosis
    - Trauma/Mechanical: Fractures, Head Trauma, Mechanical Bowel Obstruction
    - Endocrine/Metabolic: Diabetes, Thyroid Disease, Electrolyte Imbalances
    - Psychiatric/Functional: Depression, Anxiety, Functional Disorders
    
    ${isPediatric ? 
    `The output MUST be a single, perfectly valid JSON object with this structure: 
    {"diagnosis": string, "primaryInfo": string, "openingLine": string, "isPediatric": true, "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": object, "developmentalStage": string, "communicationLevel": string}}.` :
    `The output MUST be a single, perfectly valid JSON object with this exact structure: {"diagnosis": string, "primaryInfo": string, "openingLine": string}.`}

    - "diagnosis": The most likely diagnosis for the case that fits the ${randomBucket} category
    - "primaryInfo": A detailed clinical history string, formatted with markdown headings. This history is the single source of truth for the AI patient. It MUST include all of the following sections:
        - ## BIODATA ${isPediatric ? '(Include child age and accompanying parent)' : ''}
        - ## Presenting Complaint
        - ## History of Presenting Complaint
        - ## Past Medical and Surgical History
        - ## Drug History
        - ## Family History
        - ## Social History ${isPediatric ? '(Include family structure, school/daycare, developmental concerns)' : ''}
        - ## Review of Systems
        ${isPediatric ? '- ## Developmental History (milestones, concerns, school performance if applicable)' : ''}
    - "openingLine": A natural, first-person statement ${isPediatric ? 'from the parent introducing the child or from the child (age-appropriate)' : 'from the patient'} that initiates the consultation.
    ${isPediatric ? `
    - "pediatricProfile": Object containing:
        - "patientAge": Age in years (use decimals for infants, e.g., 0.5 for 6 months)
        - "ageGroup": One of "infant", "toddler", "preschool", "school-age", "adolescent"
        - "respondingParent": "mother" or "father"
        - "parentProfile": Parent's education/health literacy profile
        - "developmentalStage": Brief description of child's developmental level
        - "communicationLevel": Child's ability to communicate ("non-verbal", "basic", "conversational", "adult-like")` : ''}

            Generate a case that fits the "${randomBucket}" pathophysiology category within the ${departmentName} department. The case should be clinically sound and solvable for a medical student.`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const caseJson = parseJsonResponse<Case>(response.text, context);
        return NextResponse.json(caseJson);
    } catch (error) {
        return handleApiError(error, context);
    }
}

async function handleGetPatientResponse(payload: { history: Message[], caseDetails: Case, userCountry?: string }) {
    const { history, caseDetails, userCountry } = payload;
    const context = 'getPatientResponse';
    
    // Log location data for debugging
    console.log(`[Patient Response] User Country: ${userCountry || 'Not set'}`);
    
    // Determine if this is a pediatric case
    const isPediatric = caseDetails.isPediatric || caseDetails.pediatricProfile;
    
    // Location context for patient responses
    const locationContext = userCountry ? `
    
    🌍 LOCATION: ${userCountry}
📍 CONTEXT: Patient is from ${userCountry}, uses ${userCountry} healthcare system, speaks with ${userCountry} cultural norms
🎯 REQUIREMENT: Every response must reflect ${userCountry} context - names, places, healthcare systems, cultural references
    
    - Ensure patient responses are culturally appropriate for ${userCountry}
    - If patient mentions locations, use realistic places within ${userCountry}
    - Consider local healthcare systems, cultural norms, and communication styles
    - Use regionally appropriate names, addresses, and cultural references
    - Maintain consistency with the patient's stated location throughout the conversation` : '';
    
    let systemInstruction = '';
    
    if (isPediatric && caseDetails.pediatricProfile) {
        const { patientAge, ageGroup, respondingParent, parentProfile, developmentalStage, communicationLevel } = caseDetails.pediatricProfile;
        
        systemInstruction = `You are managing a pediatric medical simulation with TWO speakers: the child patient and the ${respondingParent}.

PATIENT DETAILS:
- Child's age: ${patientAge} years old (${ageGroup})
- Communication level: ${communicationLevel}
- Developmental stage: ${developmentalStage}
- Accompanying parent: ${respondingParent}

PARENT PROFILE:
- Education: ${parentProfile.educationLevel}
- Health literacy: ${parentProfile.healthLiteracy}
- Occupation: ${parentProfile.occupation}
- Record keeping: ${parentProfile.recordKeeping}

${locationContext}

RESPONSE RULES:
1. For EACH speaker's response, use this exact JSON format:
   {
     "messages": [
       {
         "response": "the actual response text",
         "sender": "patient" or "parent",
         "speakerLabel": "Child" or "Mother" or "Father"
       }
     ]
   }

2. When both need to respond:
   - Return separate messages for each speaker
   - Put them in the order they would naturally speak
   - Each message should be complete on its own

3. Use DIRECT DIALOGUE ONLY - no narrative descriptions or parentheticals

4. Determine who should respond based on question type:
   
   **PARENT responds to:**
   - Birth history, pregnancy complications
   - Developmental milestones
   - Vaccination history
   - Past medical history the child can't remember
   - Family history
   - School performance concerns
   - Behavioral observations
   - Questions requiring detailed medical knowledge
   
   **CHILD responds to (when age-appropriate):**
   - Current symptoms they can describe
   - Pain location and severity (if old enough)
   - Activities they like/dislike
   - How they feel right now
   - Simple yes/no questions about symptoms
   
   **BOTH may contribute to:**
   - Recent illness history (parent provides context, child adds experience)
   - Current concerns (parent observes, child describes feelings)

5. AGE-APPROPRIATE RESPONSES:
   - Infants/Toddlers: Only parent speaks
   - Preschool: Child gives simple responses, parent provides detail
   - School-age: Child can describe symptoms, parent adds context
   - Adolescents: Child may want to speak privately

6. Stay consistent with the medical history below

PRIMARY_INFORMATION:
${caseDetails.primaryInfo}`;
    } else {
        // Regular adult case
        systemInstruction = `You are a patient in a medical simulation.
    Your entire identity and medical history are defined by the PRIMARY_INFORMATION provided below.
    - You MUST adhere strictly to this information. Do not contradict it.
    - If the student asks a question not covered in your primary information, invent a plausible detail that is consistent with the overall diagnosis of '${caseDetails.diagnosis}'.
    - Respond naturally, as a real person would. Be concise.
    - Use DIRECT DIALOGUE ONLY - no narrative descriptions, stage directions, or parentheticals.
    - NEVER break character. Do not mention that you are an AI. Do not offer a diagnosis. Do not use medical jargon.

    ${locationContext}

    PRIMARY_INFORMATION:
    ${caseDetails.primaryInfo}`;
    }
    
    // Convert the history to a format suitable for the API
    const conversation = history
        .filter(msg => msg.sender === 'student' || msg.sender === 'patient' || msg.sender === 'parent')
        .map(msg => `${msg.sender === 'student' ? 'STUDENT' : msg.sender === 'parent' ? 'PARENT' : 'PATIENT'}: ${msg.text}`)
        .join('\n\n');
    
    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ 
                text: `${systemInstruction}\n\n${userCountry ? `🌍 LOCATION: ${userCountry} - Maintain ${userCountry} context throughout this response\n` : ''}CONVERSATION SO FAR:\n${conversation}\n\n${isPediatric ? 'Response (in JSON format):' : 'Patient response:'}` 
            }],
        });
        
        if (isPediatric) {
            // Parse the JSON response for pediatric cases
            const responseJson = parseJsonResponse<PatientResponse>(response.text, context);
            return NextResponse.json(responseJson);
        } else {
            // For regular cases, return the simple format
            return NextResponse.json({ 
                messages: [{
                    response: response.text.trim(),
                    sender: 'patient',
                    speakerLabel: ''
                }]
            });
        }
    } catch (error) {
        return handleApiError(error, context);
    }
}

async function handleGetInvestigationResults(payload: { plan: string, caseDetails: Case }) {
    const { plan, caseDetails } = payload;
    const context = 'getInvestigationResults';
    const userMessage = `A medical student has requested investigations for a patient with a likely diagnosis of '${caseDetails.diagnosis}'.
    Parse their free-text plan and return ALL requested tests as a JSON array. Use two different result formats:

    QUANTITATIVE RESULTS (for lab values, vitals): 
    {"name": string, "type": "quantitative", "category": "laboratory"|"specialized", "urgency": "routine"|"urgent"|"critical", "value": number, "unit": string, "range": {"low": number, "high": number}, "status": "Normal"|"High"|"Low"|"Critical"}

    DESCRIPTIVE RESULTS (for imaging, pathology, specialized tests):
    {"name": string, "type": "descriptive", "category": "imaging"|"pathology"|"specialized", "urgency": "routine"|"urgent"|"critical", "findings": string, "impression": string, "recommendation": string, "abnormalFlags": string[], "reportType": "radiology"|"pathology"|"ecg"|"echo"|"specialist"}

    GUIDELINES:
    - Generate medically plausible, realistic results consistent with the diagnosis
    - FBC breakdown: Hemoglobin, WBC, Platelets (quantitative)
    - U&E breakdown: Sodium, Potassium, Urea, Creatinine (quantitative) 
    - LFT breakdown: Bilirubin, ALT, AST (quantitative)
    - Imaging studies: Detailed radiology reports with structured findings and impressions
    - ECGs: Professional interpretation with rhythm, axis, intervals, abnormalities
    - Echo: Structured cardiac findings with measurements and function assessment
    - Include ALL tests mentioned - do not omit any tests
    - Make some results abnormal to create educational value
    - Use professional medical terminology in descriptive reports
    - For imaging, format as: FINDINGS: [detailed observations] IMPRESSION: [clinical interpretation]

    Respond ONLY with JSON: {"results": [...]}

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
    - "whatCouldBeImproved" should contain 3-4 actionable suggestions.
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
    
    // Validate required data
    if (!caseState.department || !caseState.caseDetails) {
        return NextResponse.json({ 
            error: 'Missing required case data for detailed feedback' 
        }, { status: 400 });
    }
    
    const userMessage = `You are a senior consultant providing clinical teaching notes after observing a student's clerking. Write in a calm, non-judgmental, educational tone using direct address ("you" not "the student").

    Generate a JSON object with this exact structure: 
    {
        "diagnosis": string, 
        "keyLearningPoint": string, 
        "clerkingStructure": string,
        "missedOpportunities": [{"opportunity": string, "clinicalSignificance": string}],
        "clinicalReasoning": string,
        "communicationNotes": string,
        "clinicalPearls": string[]
    }

    TEACHING APPROACH:
    - Use direct address: "You asked about chest pain, but missed..." not "The student asked..."
    - Be encouraging and educational, not critical
    - Focus on learning opportunities rather than mistakes
    - Explain WHY things matter clinically
    - Include ALL clinically relevant missed opportunities (no artificial limits)
    - Sound like a consultant sharing clinical wisdom

    CONTENT GUIDELINES:
    - "diagnosis": The correct diagnosis for this case
    - "keyLearningPoint": One major teaching moment from this case (single sentence)
    - "clerkingStructure": Comment on whether you followed a systematic approach vs scattered questioning
    - "missedOpportunities": ALL significant questions/areas you didn't explore, with clinical significance explained
    - "clinicalReasoning": Assessment of how well you built and narrowed your differential diagnosis
    - "communicationNotes": Brief comment on your patient interaction style and empathy
    - "clinicalPearls": 1-3 memorable clinical teaching points related to this case

    Case analysis:
    - Department: ${caseState.department.name}
    - Correct Diagnosis: ${caseState.caseDetails.diagnosis}
    - Your Final Diagnosis: ${caseState.finalDiagnosis || 'Not provided'}
    - Conversation Transcript: ${JSON.stringify(caseState.messages || [])}
    - Your Management Plan: ${caseState.managementPlan || 'Not provided'}

    IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text before or after the JSON object.`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        if (!response.text) {
            throw new Error('AI response was empty');
        }
        
        const teachingNotes = parseJsonResponse<any>(response.text, context);
        
        // Validate the response structure
        const requiredFields = ['diagnosis', 'keyLearningPoint', 'clerkingStructure', 'missedOpportunities', 'clinicalReasoning', 'communicationNotes', 'clinicalPearls'];
        const missingFields = requiredFields.filter(field => !(field in teachingNotes));
        
        if (missingFields.length > 0) {
            throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
        }
        
        return NextResponse.json(teachingNotes);
    } catch (error) {
        console.error(`Error in ${context}:`, error);
        return handleApiError(error, context);
    }
}

async function handleGeneratePatientProfile(payload: { diagnosis: string; departmentName: string; userCountry?: string }) {
    const { diagnosis, departmentName, userCountry } = payload;
    const context = 'generatePatientProfile';

    const userMessage = `Generate a patient profile for a case of ${diagnosis} in the ${departmentName} department.
    ${userCountry ? `Consider cultural context of ${userCountry}.` : ''}

    The output MUST be a single, perfectly valid JSON object with this structure:
    {
        "educationLevel": "basic" | "moderate" | "well-informed",
        "healthLiteracy": "minimal" | "average" | "high",
        "occupation": string,
        "recordKeeping": "detailed" | "basic" | "minimal"
    }

    Ensure natural diversity in profiles:
    - Education and health literacy should vary independently
    - Occupations should reflect real demographics
    - Record keeping habits should vary regardless of other attributes`;

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const profileJson = parseJsonResponse<PatientProfile>(response.text, context);
        return NextResponse.json(profileJson);
    } catch (error) {
        return handleApiError(error, context);
    }
}

// --- Main Handler ---
export async function POST(request: NextRequest) {
    try {
        // Validate request method
        if (request.method !== 'POST') {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }
        
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        
        // Validate request body structure
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
        }

        const { type, payload } = body;

        // Validate type
        if (!type || typeof type !== 'string') {
            return NextResponse.json({ error: 'Request type is required' }, { status: 400 });
        }

        // Validate payload
        if (!payload || typeof payload !== 'object') {
            return NextResponse.json({ error: 'Request payload is required' }, { status: 400 });
        }

        // List of valid request types
        const validTypes = [
            'generateCase',
            'getPatientResponse',
            'getInvestigationResults',
            'getFeedback',
            'getDetailedFeedback',
            'generatePatientProfile'
        ];

        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: `Invalid request type: ${type}` }, { status: 400 });
        }

        console.log(`Processing ${type} request`);

        switch (type) {
            case 'generateCase':
                return handleGenerateCase(payload);
            case 'getPatientResponse':
                return handleGetPatientResponse(payload);
            case 'getInvestigationResults':
                return handleGetInvestigationResults(payload);
            case 'getFeedback':
                return handleGetFeedback(payload);
            case 'getDetailedFeedback':
                return handleGetDetailedFeedback(payload);
            case 'generatePatientProfile':
                return handleGeneratePatientProfile(payload);
            default:
                return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
        }
    } catch (error) {
        console.error('Unhandled error in POST handler:', error);
        
        // If it's already a NextResponse, return it
        if (error instanceof Response) {
            return error;
        }
        
        return handleApiError(error, 'POST');
    }
} 