import { CaseState } from '../../../types';

export const feedbackPrompt = (caseState: CaseState) =>
`Provide clinical feedback. JSON: {
    "diagnosis": string, 
    "keyLearningPoint": string, 
    "whatYouDidWell": string[],
    "whatCouldBeImproved": string[],
    "clinicalTip": string
}

IMPORTANT: The "diagnosis" field should contain ONLY the CORRECT diagnosis name (from case generation), NOT the student's diagnosis (e.g., "Acute Myocardial Infarction", "Severe Preeclampsia"), not explanations or commentary.

Use direct address ("you"). Be encouraging and educational. Focus on learning opportunities.

Case: ${caseState.department || 'Unknown'}
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

IMPORTANT: The "diagnosis" field should contain ONLY the CORRECT diagnosis name (from case generation), NOT the student's diagnosis (e.g., "Acute Myocardial Infarction", "Severe Preeclampsia"), not explanations or commentary.

Use direct address ("you"). Be encouraging and educational. Focus on learning opportunities. Explain clinical significance.

MISSED OPPORTUNITIES ANALYSIS:
**CRITICAL: Before identifying any missed opportunities, you MUST cross-reference what the student actually did with what they should have done.**

**STEP 1: CROSS-REFERENCE ANALYSIS**
Before flagging anything as "missed," you MUST verify:

1. **EXAMINATION CROSS-REFERENCE**: 
   - Check the student's examination plan against the examination results
   - If they requested "cardiovascular examination" AND got cardiovascular results → DO NOT flag as missed
   - If they requested "general examination" AND got vital signs → DO NOT flag as missed
   - Only flag examinations that were NOT requested AND would be clinically relevant

2. **INVESTIGATION CROSS-REFERENCE**:
   - Check the student's investigation plan against the investigation results  
   - If they requested "ECG" AND got ECG results → DO NOT flag as missed
   - If they requested "chest X-ray" AND got chest X-ray results → DO NOT flag as missed
   - Only flag investigations that were NOT requested AND would be clinically relevant

3. **MANAGEMENT CROSS-REFERENCE**:
   - Check the student's management plan against what was actually provided
   - If they mentioned a treatment AND it's in their plan → DO NOT flag as missed
   - Only flag management gaps that are actually missing from their plan

**STEP 2: REASONING VALIDATION**
For each potential missed opportunity, ask yourself:
- "Did the student actually request this?" → If YES, do not flag
- "Did the student receive results for this?" → If YES, do not flag  
- "Is this actually missing from their plan?" → If NO, do not flag
- "Would this be clinically relevant for this specific case?" → If NO, do not flag

**STEP 3: IDENTIFY ACTUAL GAPS**
Only after cross-referencing, identify specific missed opportunities across these domains:

1. **CLERKING OPPORTUNITIES**: What important history questions were not asked? What communication gaps occurred? What information was missed that could have aided diagnosis?

2. **EXAMINATION OPPORTUNITIES**: What system examinations were NOT requested that would be relevant for this case? (Only flag if they didn't request it AND didn't get results)

3. **INVESTIGATION OPPORTUNITIES**: What important investigations were NOT requested? What inappropriate investigations were requested? What timing or urgency considerations were missed?

4. **MANAGEMENT OPPORTUNITIES**: What treatment gaps exist in their actual plan? What follow-up planning was missed? What safety considerations were overlooked?

For each missed opportunity, explain:
- What was missed (specific and actionable)
- Why it matters clinically (clinical significance)
- How it could have changed the patient's care
AVOID DUPLICATION: Do not include diagnostic reasoning gaps in missed opportunities as these are covered in the clinical reasoning section.
**VALIDATION CHECK**: Before finalizing, verify that you are NOT flagging anything the student actually did or requested.

${surgicalContext}

Case: ${caseState.department || 'Unknown'}
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
- The "diagnosis" field should contain ONLY the CORRECT diagnosis name (from case generation), NOT the student's diagnosis
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
**CRITICAL: Before identifying any missed opportunities, you MUST cross-reference what the student actually did with what they should have done.**

**STEP 1: CROSS-REFERENCE ANALYSIS**
Before flagging anything as "missed," you MUST verify:

1. **EXAMINATION CROSS-REFERENCE**: 
   - Check the student's examination plan against the examination results
   - If they requested "cardiovascular examination" AND got cardiovascular results → DO NOT flag as missed
   - If they requested "general examination" AND got vital signs → DO NOT flag as missed
   - Only flag examinations that were NOT requested AND would be clinically relevant

2. **INVESTIGATION CROSS-REFERENCE**:
   - Check the student's investigation plan against the investigation results  
   - If they requested "ECG" AND got ECG results → DO NOT flag as missed
   - If they requested "chest X-ray" AND got chest X-ray results → DO NOT flag as missed
   - Only flag investigations that were NOT requested AND would be clinically relevant

3. **MANAGEMENT CROSS-REFERENCE**:
   - Check the student's management plan against what was actually provided
   - If they mentioned a treatment AND it's in their plan → DO NOT flag as missed
   - Only flag management gaps that are actually missing from their plan

**STEP 2: REASONING VALIDATION**
For each potential missed opportunity, ask yourself:
- "Did the student actually request this?" → If YES, do not flag
- "Did the student receive results for this?" → If YES, do not flag  
- "Is this actually missing from their plan?" → If NO, do not flag
- "Would this be clinically relevant for this specific case?" → If NO, do not flag

**STEP 3: IDENTIFY ACTUAL GAPS**
Only after cross-referencing, identify specific missed opportunities across these domains:

1. **CLERKING OPPORTUNITIES**: What important history questions were not asked? What communication gaps occurred? What information was missed that could have aided diagnosis?

2. **EXAMINATION OPPORTUNITIES**: What system examinations were NOT requested that would be relevant for this case? (Only flag if they didn't request it AND didn't get results)

3. **INVESTIGATION OPPORTUNITIES**: What important investigations were NOT requested? What inappropriate investigations were requested? What timing or urgency considerations were missed?

4. **MANAGEMENT OPPORTUNITIES**: What treatment gaps exist in their actual plan? What follow-up planning was missed? What safety considerations were overlooked?

For each missed opportunity, explain:
- What was missed (specific and actionable)
- Why it matters clinically (clinical significance)  
- How it could have changed the patient's care

**VALIDATION CHECK**: Before finalizing, verify that you are NOT flagging anything the student actually did or requested.

Use direct address ("you"). Be encouraging and educational. Focus on learning opportunities.

${surgicalContext}

Case: ${caseState.department || 'Unknown'}
Correct Diagnosis: ${caseState.caseDetails?.diagnosis || 'Unknown'}
Your Diagnosis: ${caseState.finalDiagnosis || 'Not provided'}
Examination Plan: ${caseState.examinationPlan || 'Not provided'}
Investigation Plan: ${caseState.investigationPlan || 'Not provided'}
Management Plan: ${caseState.managementPlan || 'Not provided'}
Conversation: ${JSON.stringify(caseState.messages || [])}`;

export const getSurgicalContext = (caseState: CaseState) => {
    // Handle null department case
    if (!caseState.department) return '';
    
    const department = caseState.department; // TypeScript now knows this is not null
    const isSurgical = department.toLowerCase().includes('surgery') || department.toLowerCase().includes('surgical');
    const isCardiothoracic = department.toLowerCase().includes('cardiothoracic') || department.toLowerCase().includes('cardiac');
    const isGeneralSurgery = department.toLowerCase().includes('general surgery');
    
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
    // Handle null department case
    if (!caseState.department) return '';
    
    const department = caseState.department; // TypeScript now knows this is not null
    const isSurgical = department.toLowerCase().includes('surgery') || department.toLowerCase().includes('surgical');
    const isCardiothoracic = department.toLowerCase().includes('cardiothoracic') || department.toLowerCase().includes('cardiac');
    const isGeneralSurgery = department.toLowerCase().includes('general surgery');
    
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