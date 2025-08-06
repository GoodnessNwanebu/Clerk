import { CaseState } from '../../types';

export const feedbackPrompt = (caseState: CaseState) =>
`Provide clinical feedback. JSON: {
    "diagnosis": string, 
    "keyLearningPoint": string, 
    "whatYouDidWell": string[],
    "whatCouldBeImproved": string[],
    "clinicalTip": string
}

IMPORTANT: The "diagnosis" field should contain ONLY the diagnosis name (e.g., "Acute Myocardial Infarction", "Severe Preeclampsia"), not explanations or commentary.

Use direct address ("you"). Be encouraging and educational. Focus on learning opportunities.

Case: ${caseState.department?.name || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Your Diagnosis: ${caseState.finalDiagnosis}
Conversation: ${JSON.stringify(caseState.messages || [])}
Management Plan: ${caseState.managementPlan}`;

export const detailedFeedbackPrompt = (caseState: CaseState, surgicalContext: string) =>
`Provide clinical teaching notes. JSON: {
    "diagnosis": string, 
    "keyLearningPoint": string, 
    "clerkingStructure": string,
    "missedOpportunities": [{"opportunity": string, "clinicalSignificance": string}],
    "clinicalReasoning": string,
    "communicationNotes": string,
    "clinicalPearls": string[]
}

IMPORTANT: The "diagnosis" field should contain ONLY the diagnosis name (e.g., "Acute Myocardial Infarction", "Severe Preeclampsia"), not explanations or commentary.

Use direct address ("you"). Be encouraging and educational. Focus on learning opportunities. Explain clinical significance.

MISSED OPPORTUNITIES ANALYSIS:
Analyze the student's performance across these four domains and identify specific missed opportunities:

1. **CLERKING OPPORTUNITIES**: What important history questions were not asked? What communication gaps occurred? What information was missed that could have aided diagnosis?

2. **EXAMINATION OPPORTUNITIES**: What system examinations were not performed that would be relevant for this case? What examination techniques were missed?

3. **INVESTIGATION OPPORTUNITIES**: What important investigations were not requested? What inappropriate investigations were requested? What timing or urgency considerations were missed?

4. **MANAGEMENT OPPORTUNITIES**: What treatment gaps exist? What follow-up planning was missed? What safety considerations were overlooked?

For each missed opportunity, explain:
- What was missed (specific and actionable)
- Why it matters clinically (clinical significance)
- How it could have changed the patient's care

AVOID DUPLICATION: Do not include diagnostic reasoning gaps in missed opportunities as these are covered in the clinical reasoning section.

${surgicalContext}

Case: ${caseState.department?.name || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Your Diagnosis: ${caseState.finalDiagnosis || 'Not provided'}
Examination Plan: ${caseState.examinationPlan || 'Not provided'}
Investigation Plan: ${caseState.investigationPlan || 'Not provided'}
Management Plan: ${caseState.managementPlan || 'Not provided'}
Conversation: ${JSON.stringify(caseState.messages || [])}`;

// New comprehensive feedback prompt that merges basic and detailed feedback
export const comprehensiveFeedbackPrompt = (caseState: CaseState, surgicalContext: string) =>
`Provide comprehensive clinical feedback that combines immediate feedback with detailed teaching notes. JSON: {
    "diagnosis": string,
    "keyLearningPoint": string,
    "whatYouDidWell": string[],
    "clinicalReasoning": string,
    "clinicalOpportunities": {
        "areasForImprovement": string[],
        "missedOpportunities": [{"opportunity": string, "clinicalSignificance": string}]
    },
    "clinicalPearls": string[]
}

IMPORTANT: 
- The "diagnosis" field should contain ONLY the diagnosis name
- "whatYouDidWell" should include 4-5 points, incorporating positive communication and clerking structure feedback
- "clinicalReasoning" should analyze the student's thinking process and diagnostic reasoning
- "areasForImprovement" should include general improvement areas and negative communication/clerking feedback if any
- "missedOpportunities" should be specific clinical opportunities with significance, covering:
  * **Clerking gaps**: History taking, communication, information gathering missed
  * **Examination gaps**: Systems not examined that would be appropriate for the case
  * **Investigation gaps**: Important tests not requested or inappropriate tests requested
  * **Management plan gaps**: Treatment, follow-up, or safety considerations missed
- "clinicalPearls" should be 3-5 actionable clinical tips

MISSED OPPORTUNITIES ANALYSIS:
Analyze the student's performance across these four domains and identify specific missed opportunities:

1. **CLERKING OPPORTUNITIES**: What important history questions were not asked? What communication gaps occurred? What information was missed that could have aided diagnosis?

2. **EXAMINATION OPPORTUNITIES**: What system examinations were not performed that would be relevant for this case? What examination techniques were missed?

3. **INVESTIGATION OPPORTUNITIES**: What important investigations were not requested? What inappropriate investigations were requested? What timing or urgency considerations were missed?

4. **MANAGEMENT OPPORTUNITIES**: What treatment gaps exist? What follow-up planning was missed? What safety considerations were overlooked?

For each missed opportunity, explain:
- What was missed (specific and actionable)
- Why it matters clinically (clinical significance)
- How it could have changed the patient's care

AVOID DUPLICATION: Do not include diagnostic reasoning gaps in missed opportunities as these are covered in the clinical reasoning section.

Use direct address ("you"). Be encouraging and educational. Focus on learning opportunities.

${surgicalContext}

Case: ${caseState.department?.name || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Your Diagnosis: ${caseState.finalDiagnosis || 'Not provided'}
Examination Plan: ${caseState.examinationPlan || 'Not provided'}
Investigation Plan: ${caseState.investigationPlan || 'Not provided'}
Management Plan: ${caseState.managementPlan || 'Not provided'}
Conversation: ${JSON.stringify(caseState.messages || [])}`;

export const getSurgicalContext = (caseState: CaseState) => {
    const isSurgical = caseState.department?.name.toLowerCase().includes('surgery') || caseState.department?.name.toLowerCase().includes('surgical');
    const isCardiothoracic = caseState.department?.name.toLowerCase().includes('cardiothoracic') || caseState.department?.name.toLowerCase().includes('cardiac');
    const isGeneralSurgery = caseState.department?.name.toLowerCase().includes('general surgery');
    
    if (!isSurgical) return '';
    
    return `
    
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
    `;
};

export const getSurgicalTeachingContext = (caseState: CaseState) => {
    const isSurgical = caseState.department?.name.toLowerCase().includes('surgery') || caseState.department?.name.toLowerCase().includes('surgical');
    const isCardiothoracic = caseState.department?.name.toLowerCase().includes('cardiothoracic') || caseState.department?.name.toLowerCase().includes('cardiac');
    const isGeneralSurgery = caseState.department?.name.toLowerCase().includes('general surgery');
    
    if (!isSurgical) return '';
    
    return `
    
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
    `;
}; 