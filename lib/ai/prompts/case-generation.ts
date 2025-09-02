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

PATIENT COMMUNICATION GUIDELINES:
- Patients use lay terms, not medical terminology
- Medications are described in common terms (e.g., "blood pressure pills", "diabetes medicine")
- Symptoms are described naturally (e.g., "chest pain", "shortness of breath")
- Avoid patients using exact drug names or dosages
- Match communication style to education level and health literacy

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
`{"diagnosis": string, "primaryInfo": string, "openingLine": string, "isPediatric": true, "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}, "developmentalStage": string, "communicationLevel": string}}` :
`{"diagnosis": string, "primaryInfo": string, "openingLine": string, "patientProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}}`}

CRITICAL JSON FORMATTING RULES:
- ALL FIELDS ARE REQUIRED - DO NOT OMIT ANY FIELD
- ESCAPE ALL QUOTES in primaryInfo and openingLine fields using backslash: \" instead of "
- Use single quotes for patient quotes within text: 'patient said this' instead of "patient said this"
- Ensure all JSON is properly formatted with no unescaped quotes

- "diagnosis": Most likely diagnosis fitting ${randomBucket} category
- "primaryInfo": Detailed clinical history with markdown headings:
  * ## BIODATA ${isPediatric ? '(child age, parent)' : ''}
  * ## Presenting Complaint
  * ## History of Presenting Complaint
  * ## Past Medical/Surgical History
  * ## Drug History
  * ## Family History
  * ## Social History (INCLUDE SPECIFIC LOCATION: city, neighborhood, landmark, local hospital)
  * ## Review of Systems
  ${isPediatric ? '* ## Developmental History' : ''}
- "openingLine": REQUIRED - Natural first-person statement ${isPediatric ? 'from parent/child' : 'from patient'} that will be the patient's first words in the consultation
${isPediatric ? `
- "pediatricProfile": {"patientAge": number, "ageGroup": string, "respondingParent": "mother"|"father", "parentProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}, "developmentalStage": string, "communicationLevel": string}` : `
- "patientProfile": {"educationLevel": "basic"|"moderate"|"well-informed", "healthLiteracy": "minimal"|"average"|"high", "occupation": string, "recordKeeping": "detailed"|"basic"|"minimal"}`}

Generate case fitting "${randomBucket}" category in ${departmentName}.`;

export const getLocationPrompt = (userCountry?: string) => {
    return userCountry 
        ? `LOCATION: ${userCountry}
SPECIFIC LOCATION REQUIREMENTS:
- Generate a SPECIFIC city, neighborhood, and landmark for the patient
- Use REALISTIC local place names and addresses
- Include actual hospitals, clinics, or medical facilities in the area
- Reference authentic local landmarks, markets, or notable locations
- Consider local socioeconomic factors and cultural context

LOCATION GENERATION GUIDELINES:
- Choose a REAL city within ${userCountry} (not generic descriptions)
- Select a SPECIFIC neighborhood or district within that city
- Include a REALISTIC nearby landmark, hospital, or notable location
- Provide specific address details or proximity descriptions
- Use authentic local place names and cultural references

MANDATORY LOCATION FORMAT:
The patient's location in social history MUST be specific and realistic:
- "I live in [specific neighborhood], [city], near [landmark/hospital]"
- "I'm from [neighborhood] in [city], close to [hospital/landmark]"
- "I reside in [area], about [time] from [landmark] in [city]"

EXAMPLES OF GOOD LOCATIONS:
- "I live in Victoria Island, Lagos, near the Lagos University Teaching Hospital"
- "I'm from Barnawa neighborhood in Kaduna city, close to Ahmadu Bello University"
- "I reside in Surulere, about 15 minutes from the National Stadium in Lagos"
- "My home is in Ungwan Rimi, Kaduna, near the Central Market"

AVOID GENERIC DESCRIPTIONS:
- ❌ "I live in a suburban area of [city]"
- ❌ "I'm from a residential neighborhood"
- ❌ "I live in the city center"
- ❌ "I'm from the outskirts of [city]"
- ✅ Use specific neighborhood names, landmarks, and hospitals

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