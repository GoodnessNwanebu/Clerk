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
- Style: Balance generic OSCE format with patient-specific context
- Use patient's age, gender, and presentation in questions where relevant
- Reference specific symptoms/findings from the patient history
- Realistic OSCE exam style questions

QUESTION DOMAINS (distribute 10 questions across these 6 areas):
1. Primary Diagnosis (1-2 questions) - most likely diagnosis, diagnostic reasoning
2. Differential Diagnosis (1-2 questions) - alternative diagnoses to consider
3. Risk Factors (2 questions) - factors that contributed to this condition
4. Investigations (2 questions) - appropriate tests and imaging
5. Management/Treatment (2 questions) - treatment plans and interventions  
6. Complications/Monitoring (1 question) - potential complications to watch for

QUESTION EXAMPLES:
- "What is the most likely diagnosis for this ${patientContext}?"
- "Given this patient's presentation, what risk factors likely contributed to their condition?"
- "What investigations would you order to confirm the diagnosis?"
- "Outline your initial management plan for this patient"
- "What complications should you monitor for in this case?"

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
      "question": "List 3 key risk factors that likely contributed to this patient's condition",
      "answer": "1. Risk factor 1 with explanation 2. Risk factor 2 with explanation 3. Risk factor 3 with explanation"
    }
    // ... continue for all 10 questions
  ]
}

IMPORTANT:
- Questions should test clinical knowledge appropriate for medical students
- Use realistic OSCE language and format
- Answers should be comprehensive but concise
- Reference the specific patient context where appropriate
- Ensure questions cover all 6 domains listed above
- Each question should have a unique ID (q1, q2, ... q10)`;
};
