import { NextResponse } from 'next/server';
import { createAIClient } from './ai-wrapper';
import type { PrimaryContext } from '../../types/diagnosis';
import type { ExaminationResult } from '../../types/examination';
import type { InvestigationResult } from '../../types/investigation';

// Ensure the API key is available in the server environment
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set for the serverless function.");
}

export const ai = createAIClient(process.env.GEMINI_API_KEY);
export const MODEL = 'gemini-2.5-flash';

// Medical education pathophysiology buckets
export const MEDICAL_BUCKETS = [
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
export const LOCATION_CONTEXTS: { [key: string]: string } = {
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

// --- Helper to safely parse JSON from Gemini response ---
export const parseJsonResponse = <T>(text: string, context: string): T => {
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
    
    // Additional cleanup for common AI response artifacts
    jsonStr = jsonStr.replace(/^[^{]*/, ''); // Remove anything before first {
    jsonStr = jsonStr.replace(/}[^}]*$/, '}'); // Remove anything after last }
    
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
        
        // Try one more time with more aggressive cleaning
        try {
            // Remove all newlines and extra spaces that might break JSON
            const cleanedJson = jsonStr.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            const parsedData = JSON.parse(cleanedJson);
            
            if (typeof parsedData !== 'object' || parsedData === null) {
                throw new Error('Response is not a valid JSON object');
            }
            
            return parsedData as T;
        } catch (secondError) {
            console.error("Second parsing attempt failed:", secondError);
            
            // Provide more specific error messages
            if (e instanceof SyntaxError) {
                throw new Error(`The AI returned malformed JSON for ${context}. Please try again.`);
            }
            
            throw new Error(`The AI returned an invalid format for ${context}. Please try again.`);
        }
    }
};

// Helper function to generate AI responses
export const generateAIResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

export const handleApiError = (error: unknown, context: string) => {
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

// Enhanced saved case AI generation functions
export async function generateClinicalSummary(
  patientInfo: PrimaryContext,
  examinationResults: ExaminationResult[],
  investigationResults: InvestigationResult[]
): Promise<string | null> {
  try {
    const prompt = `Generate a concise clinical summary for this patient case:

Patient Information:
- Primary Info: ${patientInfo.primaryInfo}
- Opening Line: ${patientInfo.openingLine}
- Diagnosis: ${patientInfo.diagnosis}

Key Examination Findings:
${examinationResults.map(result => {
  if (result.type === 'quantitative') {
    return `- ${result.name}: ${result.value} ${result.unit} (${result.status})`;
  } else {
    return `- ${result.name}: ${result.findings}`;
  }
}).join('\n')}

Key Investigation Results:
${investigationResults.map(result => {
  if (result.type === 'quantitative') {
    return `- ${result.name}: ${result.value} ${result.unit}`;
  } else {
    return `- ${result.name}: ${result.findings}`;
  }
}).join('\n')}

Please provide a 2-3 sentence clinical summary that captures the patient's presentation, key findings, and diagnosis. Focus on the most clinically relevant information.`;

    const response = await generateAIResponse(prompt);
    return response;
  } catch (error) {
    console.error('Error generating clinical summary:', error);
    return null;
  }
}

export async function generateKeyFindings(
  examinationResults: ExaminationResult[],
  investigationResults: InvestigationResult[]
): Promise<Array<{
  finding: string;
  significance: string;
  rationale: string;
  category: string;
}> | null> {
  try {
    const prompt = `Analyze these examination and investigation results to identify the most important clinical findings with detailed rationale:

Examination Results:
${examinationResults.map(result => {
  if (result.type === 'quantitative') {
    return `- ${result.name}: ${result.value} ${result.unit} (${result.status})`;
  } else {
    return `- ${result.name}: ${result.findings} (${result.impression})`;
  }
}).join('\n')}

Investigation Results:
${investigationResults.map(result => {
  if (result.type === 'quantitative') {
    return `- ${result.name}: ${result.value} ${result.unit}`;
  } else {
    return `- ${result.name}: ${result.findings}`;
  }
}).join('\n')}

Please return a JSON array of the 5-8 most important findings in this format:
[
  {
    "finding": "ST elevation in leads II, III, aVF",
    "significance": "Indicates inferior STEMI",
    "rationale": "ST elevation in inferior leads (II, III, aVF) indicates transmural myocardial injury in the inferior wall of the heart, which is supplied by the right coronary artery. This is a critical finding that requires immediate intervention.",
    "category": "ECG"
  }
]

Focus on abnormal findings and clinically significant results. Provide detailed rationale explaining WHY each finding is important and what it means clinically.`;

    const response = await generateAIResponse(prompt);
    
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : null;
    } catch (parseError) {
      console.error('Error parsing key findings JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error generating key findings:', error);
    return null;
  }
}

export async function generateInvestigations(
  diagnosis: string,
  patientInfo: PrimaryContext
): Promise<Array<{
  investigation: string;
  rationale: string;
  expectedFindings: string;
  clinicalSignificance: string;
}> | null> {
  try {
    const prompt = `Based on the diagnosis and patient presentation, generate the APPROPRIATE investigations that SHOULD be ordered for this condition (not what the student actually ordered):

Diagnosis: ${diagnosis}
Patient Presentation: ${patientInfo.primaryInfo} ${patientInfo.openingLine}

Please return a JSON array of the appropriate investigations in this format:
[
  {
    "investigation": "Troponin",
    "rationale": "Cardiac biomarker to confirm myocardial injury. Troponin I or T levels rise 3-4 hours after myocardial injury and remain elevated for 7-10 days, making them highly sensitive and specific for acute myocardial infarction.",
    "expectedFindings": "Elevated levels (>99th percentile of normal) indicate myocardial injury",
    "clinicalSignificance": "Confirms diagnosis of acute myocardial infarction and helps risk stratify patients"
  }
]

Focus on what investigations are STANDARD OF CARE for this condition, not what the student chose. Provide detailed rationale explaining WHY each investigation is appropriate and what it tells us.`;

    const response = await generateAIResponse(prompt);
    
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : null;
    } catch (parseError) {
      console.error('Error parsing investigations JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error generating investigations:', error);
    return null;
  }
}

export async function generateManagementPlan(
  diagnosis: string,
  patientInfo: any
): Promise<any[] | null> {
  try {
    const prompt = `Based on the diagnosis and patient presentation, generate the APPROPRIATE management plan that SHOULD be implemented for this condition (not what the student actually wrote):

Diagnosis: ${diagnosis}
Patient Presentation: ${patientInfo.primaryInfo} ${patientInfo.openingLine}

Please return a JSON array of the appropriate management steps in this format:
[
  {
    "intervention": "Immediate PCI (Percutaneous Coronary Intervention)",
    "rationale": "Primary PCI is the gold standard treatment for STEMI. It should be performed within 90 minutes of first medical contact to restore blood flow and minimize myocardial damage.",
    "timing": "Immediate (within 90 minutes)",
    "expectedOutcome": "Restoration of coronary blood flow, reduction in infarct size, and improved survival"
  }
]

Focus on what management is STANDARD OF CARE for this condition, not what the student chose. Provide detailed rationale explaining WHY each intervention is appropriate and when it should be done.`;

    const response = await generateAIResponse(prompt);
    
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : null;
    } catch (parseError) {
      console.error('Error parsing management plan JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error generating management plan:', error);
    return null;
  }
}

export async function generateClinicalOpportunities(
  feedback: any,
  diagnosis: string
): Promise<any[] | null> {
  try {
    const prompt = `Based on the feedback and diagnosis, identify the clinical opportunities that were missed or could be improved:

Diagnosis: ${diagnosis}

Feedback:
- Areas for Improvement: ${feedback.areasForImprovement?.join(', ') || 'Not provided'}
- Missed Opportunities: ${feedback.missedOpportunities?.map((opp: any) => `${opp.opportunity}: ${opp.clinicalSignificance}`).join(', ') || 'Not provided'}
- Key Learning Points: ${feedback.keyLearningPoints?.join(', ') || 'Not provided'}

Please return a JSON array of clinical opportunities in this format:
[
  {
    "opportunity": "Early ECG interpretation",
    "clinicalSignificance": "Delayed recognition of STEMI can lead to increased myocardial damage and worse outcomes",
    "learningPoint": "Always prioritize ECG interpretation in chest pain patients - time is muscle in STEMI"
  }
]

Focus on what opportunities were missed and their clinical significance. Provide learning points for future cases.`;

    const response = await generateAIResponse(prompt);
    
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : null;
    } catch (parseError) {
      console.error('Error parsing clinical opportunities JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error generating clinical opportunities:', error);
    return null;
  }
}

export async function generateClinicalPearls(
  feedback: any,
  diagnosis: string
): Promise<string | null> {
  try {
    const prompt = `Based on this feedback and diagnosis, generate 2-3 clinical pearls for learning:

Diagnosis: ${diagnosis}

Feedback:
- Key Learning Points: ${feedback.keyLearningPoints?.join(', ') || 'Not provided'}
- Areas for Improvement: ${feedback.areasForImprovement?.join(', ') || 'Not provided'}
- Strengths: ${feedback.strengths?.join(', ') || 'Not provided'}

Please provide 2-3 concise clinical pearls that would help a medical student learn from this case. Focus on practical clinical knowledge and common pitfalls.`;

    const response = await generateAIResponse(prompt);
    return response;
  } catch (error) {
    console.error('Error generating clinical pearls:', error);
    return null;
  }
}

// Fallback function to create basic summaries when AI fails
export function createFallbackSummary(
  patientInfo: any,
  examinationResults: any[],
  investigationResults: any[]
): {
  clinicalSummary: string;
  keyFindings: any[];
  investigations: any[];
  managementPlan: any[];
  clinicalOpportunities: any[];
} {
  const clinicalSummary = `${patientInfo.primaryInfo} ${patientInfo.openingLine}`;
  
  const keyFindings = examinationResults
    .filter(result => result.status === 'High' || result.status === 'Low' || result.status === 'Critical' || result.findings)
    .slice(0, 5)
    .map(result => ({
      finding: `${result.name}: ${result.findings || result.value}${result.unit ? ` ${result.unit}` : ''}`,
      significance: result.status || 'Abnormal',
      rationale: `This finding indicates ${result.status || 'an abnormality'} in ${result.name}`,
      category: result.category
    }));

  const investigations = investigationResults
    .slice(0, 5)
    .map(result => ({
      investigation: result.name,
      rationale: 'Standard investigation for this condition',
      expectedFindings: result.findings || 'Results available',
      clinicalSignificance: 'Important for diagnosis and management'
    }));

  const managementPlan = [
    {
      intervention: 'Standard management for this condition',
      rationale: 'Based on current clinical guidelines',
      timing: 'As appropriate for the condition',
      expectedOutcome: 'Improved patient outcomes'
    }
  ];

  const clinicalOpportunities = [
    {
      opportunity: 'Review case for learning opportunities',
      clinicalSignificance: 'Important for improving clinical skills',
      learningPoint: 'Always reflect on cases to improve future practice'
    }
  ];

  return {
    clinicalSummary,
    keyFindings,
    investigations,
    managementPlan,
    clinicalOpportunities
  };
}

// Generate standard medical case report (rounds format)
export async function generateCaseReport(context: {
  primaryContext: any;
  secondaryContext: any;
}): Promise<any> {
  try {
    const { primaryContext, secondaryContext } = context;
    
    const prompt = `Generate a standard medical case report in the format typically presented during medical rounds. Use the following case data:

PATIENT INFORMATION:
${primaryContext.primaryInfo}

PRESENTING COMPLAINT:
${primaryContext.openingLine}

CONVERSATION HISTORY:
${secondaryContext.messages.map((msg: any) => `${msg.sender}: ${msg.text}`).join('\n')}

EXAMINATION RESULTS:
${secondaryContext.examinationResults.map((result: any) => 
  `${result.name}: ${result.findings || result.value}${result.unit ? ` ${result.unit}` : ''}`
).join('\n')}

INVESTIGATION RESULTS:
${secondaryContext.investigationResults.map((result: any) => 
  `${result.name}: ${result.findings || result.value}${result.unit ? ` ${result.unit}` : ''}`
).join('\n')}

FINAL DIAGNOSIS:
${secondaryContext.finalDiagnosis}

MANAGEMENT PLAN:
${secondaryContext.managementPlan}

Please structure the case report in the following JSON format:
{
  "patientInfo": {
    "age": "extracted age",
    "gender": "extracted gender", 
    "presentingComplaint": "chief complaint",
    "historyOfPresentingIllness": "HPI summary",
    "pastMedicalHistory": "PMH summary",
    "medications": "current medications",
    "allergies": "known allergies",
    "socialHistory": "social history",
    "familyHistory": "family history"
  },
  "examination": {
    "generalExamination": "general exam findings",
    "systemicExamination": "systemic exam findings", 
    "findings": ["key finding 1", "key finding 2"]
  },
  "investigations": {
    "requested": ["investigation 1", "investigation 2"],
    "results": ["result 1", "result 2"]
  },
  "assessment": {
    "differentialDiagnosis": ["DD1", "DD2", "DD3"],
    "finalDiagnosis": "final diagnosis",
    "reasoning": "clinical reasoning"
  },
  "management": {
    "immediate": ["immediate action 1", "immediate action 2"],
    "shortTerm": ["short term plan 1", "short term plan 2"],
    "longTerm": ["long term plan 1", "long term plan 2"],
    "followUp": "follow up plan"
  },
  "learningPoints": ["learning point 1", "learning point 2", "learning point 3"]
}

Focus on creating a professional, structured case report suitable for medical rounds presentation.`;

    const response = await generateAIResponse(prompt);
    const caseReport = parseJsonResponse(response, 'case report generation');
    
    return {
      ...caseReport as any,
      id: `report_${Date.now()}`,
      caseId: primaryContext.caseId || 'unknown',
      createdAt: new Date(),
      isVisible: false // Default to hidden
    };

  } catch (error) {
    console.error('Error generating case report:', error);
    
    // Return a fallback case report structure
    return {
      id: `report_${Date.now()}`,
      caseId: context.primaryContext.caseId || 'unknown',
      patientInfo: {
        age: 'Extracted from case data',
        gender: 'Extracted from case data',
        presentingComplaint: context.primaryContext.openingLine || 'Not available',
        historyOfPresentingIllness: 'Summarized from conversation',
        pastMedicalHistory: 'Extracted from case data',
        medications: 'Extracted from case data',
        allergies: 'Extracted from case data',
        socialHistory: 'Extracted from case data',
        familyHistory: 'Extracted from case data'
      },
      examination: {
        generalExamination: 'Summarized from examination results',
        systemicExamination: 'Summarized from examination results',
        findings: context.secondaryContext.examinationResults?.map((r: any) => r.name) || []
      },
      investigations: {
        requested: context.secondaryContext.investigationResults?.map((r: any) => r.name) || [],
        results: context.secondaryContext.investigationResults?.map((r: any) => 
          `${r.name}: ${r.findings || r.value}${r.unit ? ` ${r.unit}` : ''}`
        ) || []
      },
      assessment: {
        differentialDiagnosis: ['Based on case data'],
        finalDiagnosis: context.secondaryContext.finalDiagnosis || 'Not provided',
        reasoning: 'Clinical reasoning based on case data'
      },
      management: {
        immediate: ['Based on case data'],
        shortTerm: ['Based on case data'],
        longTerm: ['Based on case data'],
        followUp: 'Based on case data'
      },
      learningPoints: ['Learning from this case', 'Clinical insights', 'Future considerations'],
      createdAt: new Date(),
      isVisible: false
    };
  }
} 