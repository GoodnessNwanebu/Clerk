import { NextRequest, NextResponse } from 'next/server';
import { createAIClient } from '../../../services/ai-wrapper';
import { Case, CaseState, Feedback, InvestigationResult, Message, DetailedFeedbackReport, PatientProfile, PatientResponse, ExaminationResult } from '../../../types';
import { getTimeContext } from '../../../utils/timeContext';

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

// Optimized location contexts (cached)
const LOCATION_CONTEXTS: { [key: string]: string } = {
    'United States': 'Diverse multicultural society, insurance-based healthcare',
    'United Kingdom': 'NHS universal healthcare, British cultural norms',
    'Canada': 'Multicultural society, universal healthcare, cold climate',
    'Australia': 'Multicultural society, Medicare system, sun exposure risks',
    'India': 'Diverse regional cultures, tropical climate, family-oriented',
    'Nigeria': 'Diverse ethnic groups, tropical diseases, mixed healthcare approaches',
    'Germany': 'Universal healthcare, strong social support, temperate climate',
    'France': 'Social healthcare system, Mediterranean influences',
    'Japan': 'Aging population, respectful cultural norms, modern lifestyle',
    'Brazil': 'Diverse cultural heritage, tropical climate, socioeconomic diversity'
};

// Optimized prompt templates
const PROMPT_TEMPLATES = {
    generateCase: (departmentName: string, randomBucket: string, timeContext: string, locationPrompt: string, surgicalPrompt: string, pediatricPrompt: string, isPediatric: boolean, isSurgical: boolean) => 
`Generate a clinical case for medical students in '${departmentName}' department.

${timeContext}
${locationPrompt}
${surgicalPrompt}
${pediatricPrompt}

REQUIREMENTS:
- Pathophysiology category: "${randomBucket}"
- Solvable by medical students
- Balance authenticity with educational value
${isPediatric ? '- Age-appropriate presentation and developmental context' : ''}
${isSurgical ? '- Focus on surgical intervention and context' : ''}

EXAMPLES by category:
- Vascular: MI, Stroke, PVD${departmentName.toLowerCase().includes('cardiothoracic') ? ', Aortic Aneurysm, CAD' : ''}
- Infectious/Inflammatory: Pneumonia, Sepsis, Gastroenteritis${departmentName.toLowerCase().includes('surgery') ? ', Appendicitis, Cholecystitis' : ''}
- Neoplastic: Breast Cancer, Lung Cancer, Lymphoma
- Degenerative: Osteoarthritis, Alzheimer's, Parkinson's
- Autoimmune: RA, SLE, Multiple Sclerosis
- Trauma/Mechanical: Fractures, Head Trauma${departmentName.toLowerCase().includes('surgery') ? ', Bowel Obstruction' : ''}
- Endocrine/Metabolic: Diabetes, Thyroid Disease, Electrolyte Imbalances
- Psychiatric/Functional: Depression, Anxiety, Functional Disorders

OUTPUT: ${isPediatric ? 
`{"diagnosis": string, "primaryInfo": string, "openingLine": string, "isPediatric": true, "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": object, "developmentalStage": string, "communicationLevel": string}}` :
`{"diagnosis": string, "primaryInfo": string, "openingLine": string}`}

- "diagnosis": Most likely diagnosis fitting ${randomBucket} category
- "primaryInfo": Detailed clinical history with markdown headings:
  * ## BIODATA ${isPediatric ? '(child age, parent)' : ''}
  * ## Presenting Complaint
  * ## History of Presenting Complaint
  * ## Past Medical/Surgical History
  * ## Drug History
  * ## Family History
  * ## Social History
  * ## Review of Systems
  ${isPediatric ? '* ## Developmental History' : ''}
- "openingLine": Natural first-person statement ${isPediatric ? 'from parent/child' : 'from patient'}
${isPediatric ? `
- "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": object, "developmentalStage": string, "communicationLevel": string}` : ''}

Generate case fitting "${randomBucket}" category in ${departmentName}.`,

    patientResponse: (systemInstruction: string, conversation: string, isPediatric: boolean) =>
`${systemInstruction}

CONVERSATION:
${conversation}

${isPediatric ? 'Response (JSON):' : 'Patient response:'}`,

    investigationResults: (plan: string, diagnosis: string) =>
`Parse investigation plan for patient with diagnosis '${diagnosis}'.
Return JSON array with two formats:

QUANTITATIVE: {"name": string, "type": "quantitative", "category": "laboratory"|"specialized", "urgency": "routine"|"urgent"|"critical", "value": number, "unit": string, "range": {"low": number, "high": number}, "status": "Normal"|"High"|"Low"|"Critical"}

DESCRIPTIVE: {"name": string, "type": "descriptive", "category": "imaging"|"pathology"|"specialized", "urgency": "routine"|"urgent"|"critical", "findings": string, "impression": string, "recommendation": string, "abnormalFlags": string[], "reportType": "radiology"|"pathology"|"ecg"|"echo"|"specialist"}

GUIDELINES:
- Medically plausible results consistent with diagnosis
- FBC: Hemoglobin, PCV, WBC, Platelets (quantitative)
  * PCV range: 36-46% (females), 40-50% (males)
  * Hemoglobin range: 12-16 g/dL (females), 13-17 g/dL (males)
- U&E: Sodium, Potassium, Urea, Creatinine (quantitative)
- LFT: Bilirubin, ALT, AST (quantitative)
- Imaging: Detailed reports with findings and impressions
- ECGs: Professional interpretation with rhythm, axis, intervals
- Echo: Structured cardiac findings with measurements
- Include ALL requested tests
- Make some results abnormal for educational value
- Use professional medical terminology

OUTPUT: {"results": [...]}

Plan: "${plan}"`,

    examinationResults: (plan: string, diagnosis: string) =>
`Parse examination plan for patient with diagnosis '${diagnosis}'.
Return consolidated examination reports as JSON array:

QUANTITATIVE: {"name": string, "type": "quantitative", "category": "vital_signs"|"system_examination"|"special_tests", "urgency": "routine"|"urgent"|"critical", "value": number, "unit": string, "range": {"low": number, "high": number}, "status": "Normal"|"High"|"Low"|"Critical"}

DESCRIPTIVE: {"name": string, "type": "descriptive", "category": "vital_signs"|"system_examination"|"special_tests", "urgency": "routine"|"urgent"|"critical", "findings": string, "impression": string, "recommendation": string, "abnormalFlags": string[], "reportType": "cardiovascular"|"respiratory"|"abdominal"|"neurological"|"musculoskeletal"|"general"|"obstetric"|"pediatric"}

GUIDELINES:
- CONSOLIDATE examinations into comprehensive reports
- Each examination type = ONE comprehensive report
- Include inspection, palpation, percussion, auscultation in ONE report
- ALWAYS generate vital signs as separate quantitative results:
  * BP: systolic/diastolic (120/80 mmHg, range 90-140/60-90)
  * HR: bpm (72 bpm, range 60-100)
  * Temp: Celsius (37.2°C, range 36.5-37.5)
  * RR: bpm (16 bpm, range 12-20)
  * O2 Sat: % (98%, range 95-100)
- Make some vital signs abnormal for educational value
- Use professional medical terminology
- Consider patient age, gender, underlying condition

EXAMPLES:
- "cardiovascular examination" → ONE report with ALL cardiac findings
- "respiratory examination" → ONE report with ALL respiratory findings
- "abdominal examination" → ONE report with ALL abdominal findings
- "neurological examination" → ONE report with ALL neurological findings

OUTPUT: {"results": [...]}

Plan: "${plan}"`,

    feedback: (caseState: CaseState, surgicalContext: string) =>
`Analyze student performance. Provide JSON: {"diagnosis": string, "keyTakeaway": string, "whatYouDidWell": string[], "whatCouldBeImproved": string[], "clinicalTip": string}.

${surgicalContext}

Case: ${caseState.department?.name || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Conversation: ${JSON.stringify(caseState.messages)}
Student Diagnosis: ${caseState.finalDiagnosis}
Management Plan: ${caseState.managementPlan}`,

    detailedFeedback: (caseState: CaseState, surgicalContext: string) =>
`Provide clinical teaching notes. JSON: {
    "diagnosis": string, 
    "keyLearningPoint": string, 
    "clerkingStructure": string,
    "missedOpportunities": [{"opportunity": string, "clinicalSignificance": string}],
    "clinicalReasoning": string,
    "communicationNotes": string,
    "clinicalPearls": string[]
}

Use direct address ("you"). Be encouraging and educational. Focus on learning opportunities. Explain clinical significance.

${surgicalContext}

Case: ${caseState.department?.name || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Your Diagnosis: ${caseState.finalDiagnosis || 'Not provided'}
Conversation: ${JSON.stringify(caseState.messages || [])}
Management Plan: ${caseState.managementPlan || 'Not provided'}`,

    patientProfile: (diagnosis: string, departmentName: string, timeContext: string) =>
`Generate patient profile for ${diagnosis} in ${departmentName}.
${timeContext}

OUTPUT: {
    "educationLevel": "basic" | "moderate" | "well-informed",
    "healthLiteracy": "minimal" | "average" | "high", 
    "occupation": string,
    "recordKeeping": "detailed" | "basic" | "minimal"
}

Ensure natural diversity in profiles.`
};

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
    
    // Get time context for the user's location
    const timeContext = getTimeContext(userCountry);
    
    // Check if this is a pediatric case
    const isPediatric = departmentName.toLowerCase().includes('pediatric') || departmentName.toLowerCase().includes('paediatric');
    
    // Check if this is a surgical department
    const isSurgical = departmentName.toLowerCase().includes('surgery') || departmentName.toLowerCase().includes('surgical');
    const isCardiothoracic = departmentName.toLowerCase().includes('cardiothoracic') || departmentName.toLowerCase().includes('cardiac');
    const isGeneralSurgery = departmentName.toLowerCase().includes('general surgery');
    
    // Randomly select a medical bucket
    const randomBucket = MEDICAL_BUCKETS[Math.floor(Math.random() * MEDICAL_BUCKETS.length)];
    
    // Optimized location prompt
    const locationPrompt = userCountry 
        ? `LOCATION: ${userCountry}
CONTEXT: Patient from ${userCountry}, uses ${userCountry} healthcare system
REQUIREMENT: Generate authentic ${userCountry} names and cultural references
CULTURAL CONSIDERATIONS: Use culturally authentic names, consider local healthcare systems, regional factors, socioeconomic diversity
LOCATION CONTEXT: ${LOCATION_CONTEXTS[userCountry] || 'local cultural context'}`
        : `Use culturally diverse names and consider common global disease patterns.`;

    // Optimized surgical prompt
    const surgicalPrompt = isSurgical ? `
SURGICAL CASE REQUIREMENTS:
- Focus on conditions requiring surgical intervention
- Include surgical history and previous operations
- Consider pre-operative assessment and risk factors
- Mention surgical techniques and post-operative care
${isCardiothoracic ? `
- For cardiothoracic: cardiac/pulmonary function assessment, risk factors, ECG findings, cardiac imaging, surgical procedures, post-operative monitoring` : ''}
${isGeneralSurgery ? `
- For general surgery: abdominal examination, common conditions (hernias, appendicitis), imaging findings, surgical approaches, post-operative care` : ''}
` : '';

    // Optimized pediatric prompt
    const pediatricPrompt = isPediatric ? `
PEDIATRIC CASE REQUIREMENTS:
- Include patient age (months for infants <2 years, years for older children)
- Specify accompanying parent (mother or father)
- Age-appropriate communication levels:
  * Infants (0-12 months): Non-verbal, parent provides history
  * Toddlers (1-3 years): Basic words, mainly parent
  * Preschool (3-5 years): Simple sentences, parent supplements
  * School-age (6-12 years): Good communication, some direct interaction
  * Adolescents (13+ years): Adult-like communication, may want privacy
- Include developmental milestones and family dynamics
` : '';
    
    const userMessage = PROMPT_TEMPLATES.generateCase(
        departmentName, 
        randomBucket, 
        timeContext.formattedContext, 
        locationPrompt, 
        surgicalPrompt, 
        pediatricPrompt, 
        isPediatric, 
        isSurgical
    );

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
    
    // Determine if this is a pediatric case
    const isPediatric = caseDetails.isPediatric || caseDetails.pediatricProfile;
    
    // Get time context for temporal awareness in patient responses
    const timeContext = getTimeContext(userCountry);
    
    // Note: Location context is established during case generation and maintained through caseDetails.primaryInfo
    // No need to repeat location context here to save tokens and maintain consistency
    
    let systemInstruction = '';
    
    if (isPediatric && caseDetails.pediatricProfile) {
        const { patientAge, ageGroup, respondingParent, parentProfile, developmentalStage, communicationLevel } = caseDetails.pediatricProfile;
        
        systemInstruction = `You are managing a pediatric medical simulation with TWO speakers: the child patient and the ${respondingParent}.

${timeContext.formattedContext}

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

    ${timeContext.formattedContext}

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
                text: PROMPT_TEMPLATES.patientResponse(systemInstruction, conversation, !!isPediatric)
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
    const userMessage = PROMPT_TEMPLATES.investigationResults(plan, caseDetails.diagnosis);

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

async function handleGetExaminationResults(payload: { plan: string, caseDetails: Case }) {
    const { plan, caseDetails } = payload;
    const context = 'getExaminationResults';
    const userMessage = PROMPT_TEMPLATES.examinationResults(plan, caseDetails.diagnosis);

    try {
        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const jsonResponse = parseJsonResponse<{results: ExaminationResult[]}>(response.text, context);
        return NextResponse.json(jsonResponse.results || []);
    } catch (error) {
        return handleApiError(error, context);
    }
}

async function handleGetFeedback(payload: { caseState: CaseState }) {
    const { caseState } = payload;
    const context = 'getCaseFeedback';
    
    // Check if this is a surgical department
    const isSurgical = caseState.department?.name.toLowerCase().includes('surgery') || caseState.department?.name.toLowerCase().includes('surgical');
    const isCardiothoracic = caseState.department?.name.toLowerCase().includes('cardiothoracic') || caseState.department?.name.toLowerCase().includes('cardiac');
    const isGeneralSurgery = caseState.department?.name.toLowerCase().includes('general surgery');
    
    const surgicalContext = isSurgical ? `
    
    SURGICAL ASSESSMENT FOCUS:
    - Evaluate surgical history taking and risk assessment
    - Consider pre-operative assessment completeness
    - Assess understanding of surgical indications and contraindications
    - Review knowledge of relevant surgical procedures
    - Evaluate post-operative care planning
    ${isCardiothoracic ? `
    - For cardiothoracic cases, assess cardiac/pulmonary examination skills
    - Evaluate understanding of cardiac risk factors and assessment
    - Consider knowledge of cardiac/pulmonary surgical procedures
    - Assess awareness of post-cardiac surgery complications` : ''}
    ${isGeneralSurgery ? `
    - For general surgery cases, assess abdominal examination skills
    - Evaluate understanding of common surgical conditions
    - Consider knowledge of surgical approaches and techniques
    - Assess awareness of post-operative complications` : ''}
    ` : '';
    
    const userMessage = PROMPT_TEMPLATES.feedback(caseState, surgicalContext);

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
    
    // Check if this is a surgical department
    const isSurgical = caseState.department.name.toLowerCase().includes('surgery') || caseState.department.name.toLowerCase().includes('surgical');
    const isCardiothoracic = caseState.department.name.toLowerCase().includes('cardiothoracic') || caseState.department.name.toLowerCase().includes('cardiac');
    const isGeneralSurgery = caseState.department.name.toLowerCase().includes('general surgery');
    
    const surgicalTeachingContext = isSurgical ? `
    
    SURGICAL TEACHING FOCUS:
    - Emphasize surgical history taking and risk assessment
    - Highlight pre-operative assessment requirements
    - Focus on surgical indications and contraindications
    - Include relevant surgical procedures and techniques
    - Address post-operative care and complications
    ${isCardiothoracic ? `
    - For cardiothoracic cases, emphasize cardiac/pulmonary examination
    - Include cardiac risk assessment and imaging interpretation
    - Cover relevant cardiac/pulmonary surgical procedures
    - Address post-cardiac surgery monitoring and complications` : ''}
    ${isGeneralSurgery ? `
    - For general surgery cases, emphasize abdominal examination
    - Include common surgical conditions and presentations
    - Cover surgical approaches and techniques
    - Address post-operative care and complications` : ''}
    ` : '';
    
    const userMessage = PROMPT_TEMPLATES.detailedFeedback(caseState, surgicalTeachingContext);

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
    
    // Get time context for temporal awareness
    const timeContext = getTimeContext(userCountry);

    const userMessage = PROMPT_TEMPLATES.patientProfile(diagnosis, departmentName, timeContext.formattedContext);

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
            'getExaminationResults',
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
            case 'getExaminationResults':
                return handleGetExaminationResults(payload);
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