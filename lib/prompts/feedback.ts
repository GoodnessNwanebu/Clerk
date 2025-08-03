import { CaseState } from '../../types';

export const feedbackPrompt = (caseState: CaseState, surgicalContext: string) =>
`Analyze student performance. Provide JSON: {"diagnosis": string, "keyTakeaway": string, "whatYouDidWell": string[], "whatCouldBeImproved": string[], "clinicalTip": string}.

IMPORTANT: The "diagnosis" field should contain ONLY the diagnosis name (e.g., "Acute Myocardial Infarction", "Severe Preeclampsia"), not explanations or commentary.

${surgicalContext}

Case: ${caseState.department?.name || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Conversation: ${JSON.stringify(caseState.messages)}
Student Diagnosis: ${caseState.finalDiagnosis}
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

${surgicalContext}

Case: ${caseState.department?.name || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Your Diagnosis: ${caseState.finalDiagnosis || 'Not provided'}
Conversation: ${JSON.stringify(caseState.messages || [])}
Management Plan: ${caseState.managementPlan || 'Not provided'}`;

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