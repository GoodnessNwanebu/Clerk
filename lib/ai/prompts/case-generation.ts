import { DifficultyLevel } from '../../../types';
import { LOCATION_CONTEXTS } from '../ai-utils';

// Difficulty-specific prompt functions
export const getDifficultyPrompt = (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
        case 'standard':
            return ''; // Use existing logic (no additional requirements)
            
        case 'intermediate':
            return `
INTERMEDIATE DIFFICULTY REQUIREMENTS:
- Include 1-2 relevant comorbidities
- Slightly atypical presentation of the primary diagnosis
- Some conflicting or unclear information
- Multiple possible diagnoses to consider
- Age-related factors affecting presentation
- Medication interactions or side effects
- Social factors influencing care
- Require more detailed history taking and examination
`;
            
        case 'difficult':
            return `
DIFFICULT DIFFICULTY REQUIREMENTS:
- Multiple comorbidities (3+ relevant conditions)
- Highly atypical presentation of the primary diagnosis
- Red herrings and confounding factors
- Complex social determinants of health
- Multiple organ system involvement
- Rare disease presentations or complications
- Complex medication interactions
- Cultural or language barriers
- Require comprehensive assessment and differential diagnosis
`;
            
        default:
            return '';
    }
};

export const generateCasePrompt = (
    departmentName: string, 
    randomBucket: string, 
    timeContext: string, 
    locationPrompt: string, 
    surgicalPrompt: string, 
    pediatricPrompt: string, 
    isPediatric: boolean, 
    isSurgical: boolean
) => 
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

Generate case fitting "${randomBucket}" category in ${departmentName}.`;

export const getLocationPrompt = (userCountry?: string) => {
    return userCountry 
        ? `LOCATION: ${userCountry}
CONTEXT: Patient from ${userCountry}, uses ${userCountry} healthcare system
REQUIREMENT: Generate authentic ${userCountry} names and cultural references
CULTURAL CONSIDERATIONS: Use culturally authentic names, consider local healthcare systems, regional factors, socioeconomic diversity
LOCATION CONTEXT: ${LOCATION_CONTEXTS[userCountry] || 'local cultural context'}`
        : `Use culturally diverse names and consider common global disease patterns.`;
};

export const getSurgicalPrompt = (isSurgical: boolean, isCardiothoracic: boolean, isGeneralSurgery: boolean) => {
    if (!isSurgical) return '';
    
    return `
SURGICAL CASE REQUIREMENTS:
- Focus on conditions requiring surgical intervention
- Include surgical history and previous operations
- Consider pre-operative assessment and risk factors
- Mention surgical techniques and post-operative care
${isCardiothoracic ? `
- For cardiothoracic: cardiac/pulmonary function assessment, risk factors, ECG findings, cardiac imaging, surgical procedures, post-operative monitoring` : ''}
${isGeneralSurgery ? `
- For general surgery: abdominal examination, common conditions (hernias, appendicitis), imaging findings, surgical approaches, post-operative care` : ''}
`;
};

export const getPediatricPrompt = (isPediatric: boolean) => {
    if (!isPediatric) return '';
    
    return `
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
`;
}; 