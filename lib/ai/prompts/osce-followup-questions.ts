export const osceFollowupQuestionsPrompt = (
  diagnosis: string,
  patientHistory: string,
  department: string,
  patientAge?: number,
  patientGender?: string
) => {
  const patientContext = patientAge && patientGender 
    ? `${patientAge}-year-old ${patientGender.toLowerCase()} patient`
    : 'patient';

  return `Generate exactly 10 OSCE-style follow-up questions to assess clinical knowledge and reasoning for a medical student who just completed clerking this ${patientContext}.

PATIENT CONTEXT:
- Primary Diagnosis: ${diagnosis}
- Department: ${department}
- Patient History: ${patientHistory}

QUESTION REQUIREMENTS:
- Format: Short answer questions only
- Style: Focus on GENERIC clinical knowledge about the diagnosis, not patient-specific details
- Emphasize core medical knowledge that students should know about this condition
- Questions should be the type students would encounter in any OSCE station for this diagnosis
- Avoid overly specific patient details - focus on general clinical knowledge
- **CRITICAL: DO NOT include the diagnosis name or any suggestive terms in the questions**

**IMPORTANT** First question should ask the student for their most likely diagnosis

QUESTION DOMAINS (distribute 10 questions across these 6 areas):
1. Primary Diagnosis (2 questions) - core features, diagnostic criteria, pathophysiology
2. Differential Diagnosis (1 question) - alternative diagnoses, distinguishing features
3. Risk Factors (2 questions) - general risk factors for this condition
4. Investigations (1 question) - standard investigations and their rationale
5. Management/Treatment (2 question) - general treatment principles
6. Complications/Monitoring (2 question) - common complications and monitoring



OUTPUT FORMAT:
Return a JSON object with questions and corresponding answers:

{
  "questions": [
    {
      "id": "q1",
      "domain": "primary_diagnosis",
      "question": "What is the most likely diagnosis for this patient?",
      "answer": "Detailed correct answer with clinical reasoning"
    },
    {
      "id": "q2", 
      "domain": "risk_factors",
      "question": "List 4 important risk factors for this condition",
      "answer": "1. Risk factor 1 with explanation 2. Risk factor 2 with explanation 3. Risk factor 3 with explanation"
    }
    // ... continue for all 10 questions
  ]
}

IMPORTANT:
- Questions should test FUNDAMENTAL clinical knowledge about the condition
- Focus on what every medical student should know about this condition
- Use realistic OSCE exam language and format
- Answers should be comprehensive but concise
- Questions should be applicable to ANY patient with this condition, not just this specific case
- **NEVER include the diagnosis name in questions - use generic terms like "this condition", "this patient", "this presentation"**
- Ensure questions cover all 6 domains listed above
- Each question should have a unique ID (q1, q2, ... q10)`;
};
