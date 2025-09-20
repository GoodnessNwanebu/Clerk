import { CaseState } from '../../../types';
import { OSCEStudentResponse } from '../../../types/osce';

export const osceEvaluationPrompt = (
  caseState: CaseState,
  studentResponses: OSCEStudentResponse[],
  correctAnswers: Record<string, string>,
  questions: Array<{ id: string; question: string; domain: string }>
) => {
  // Format student responses for the prompt
  const formattedResponses = studentResponses.map(response => {
    const question = questions.find(q => q.id === response.questionId);
    const correctAnswer = correctAnswers[response.questionId];
    
    return `
Question: ${question?.question || 'Unknown'}
Student Answer: ${response.studentAnswer}
Correct Answer: ${correctAnswer || 'Unknown'}
---`;
  }).join('\n');

  return `Provide comprehensive OSCE evaluation for a medical student who completed a timed clerking session and follow-up questions.

EVALUATION CONTEXT:
Department: ${caseState.department || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Student's Final Assessment: ${caseState.finalDiagnosis || 'Not provided'}

CLERKING PERFORMANCE:
Conversation History: ${JSON.stringify(caseState.messages || [])}
Examination Plan: ${caseState.examinationPlan || 'Not provided'}
Investigation Plan: ${caseState.investigationPlan || 'Not provided'}

FOLLOW-UP QUESTIONS PERFORMANCE:
${formattedResponses}

SCORING REQUIREMENTS:
Evaluate the student across these 4 categories (each scored 0-100):

1. **History Coverage (0-100)**: How thoroughly did they gather relevant history? Did they ask appropriate questions? Did they explore symptoms adequately?

2. **Relevance of Questions (0-100)**: Were their questions clinically relevant? Did they follow logical clinical reasoning? Did they avoid irrelevant tangents?

3. **Clinical Reasoning (0-100)**: Did they show evidence of clinical thinking? Were they trying to rule in/out diagnoses? Did they characterize symptoms properly? Did they show diagnostic reasoning?

4. **Follow-up Questions (0-100)**: How accurate were their answers to the 10 follow-up questions? Did they demonstrate appropriate clinical knowledge?

EVALUATION OUTPUT FORMAT:
Return JSON with this exact structure:

{
  "diagnosis": "${caseState.caseDetails?.diagnosis || 'Unknown'}",
  "scoreBreakdown": {
    "historyCoverage": number (0-100),
    "relevanceOfQuestions": number (0-100),
    "clinicalReasoning": number (0-100),
    "followupQuestions": number (0-100),
    "overallScore": number (average of above 4)
  },
  "rationaleForScore": "Contextual explanation of why the student received these specific scores, referencing their actual performance, questions asked, and reasoning demonstrated. This should be specific to their interaction, not generic.",
  "clinicalOpportunities": {
    "areasForImprovement": ["specific areas where student could improve based on their OSCE performance"],
    "missedOpportunities": [
      {
        "opportunity": "specific missed opportunity in clerking or follow-up questions",
        "clinicalSignificance": "why this matters clinically"
      }
    ]
  },
  "followupAnswers": [
    {
      "questionId": "q1",
      "question": "the actual question text",
      "correctAnswer": "the correct answer for learning"
    }
  ],
  "clinicalPearls": ["educational insights related to this case and the student's performance"]
}

IMPORTANT GUIDELINES:
- Focus ONLY on clerking and follow-up questions (no management plan evaluation)
- Rationale should reference specific aspects of the student's performance
- Clinical opportunities should focus on what they missed during the OSCE
- Be encouraging but honest about areas needing improvement
- Use direct address ("you") throughout
- Ensure scores reflect actual performance, not just participation`;
};
