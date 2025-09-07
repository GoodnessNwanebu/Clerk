import { DifficultyLevel } from '../../../types';

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
    isSurgical: boolean,
    difficulty: DifficultyLevel,
    specificPatientProfileRequest?: string,
    specificDiagnosisRequest?: string
) => {
    const difficultyPrompt = getDifficultyPrompt(difficulty);
    
    return `You are an experienced clinical educator creating realistic medical cases for medical students. Your goal is to create cases that are:
- Educationally valuable and clinically relevant
- Solvable by medical students with proper history taking and examination
- Realistic and authentic to real clinical practice
- Appropriate for the student's learning level

Your task is to generate a detailed clinical case for medical students in the **'${departmentName}'** department, focusing on the **"${randomBucket}"** pathophysiology category.

${timeContext}
${locationPrompt}
${surgicalPrompt}
${pediatricPrompt}
${difficultyPrompt ? `\n\n${difficultyPrompt}` : ''}

CRITICAL GUIDELINES FOR PATIENT PROFILE DIVERSITY AND AVOIDING STEREOTYPES:
1.  **Do NOT Stereotype by Location:** For any given 'LOCATION' (e.g., Nigeria), **absolutely do not default** to specific 'educationLevel', 'healthLiteracy', or 'occupation' stereotypes (e.g., do not always choose 'basic' education or 'market trader' for Nigeria).
2.  **Actively Vary Patient Profiles:** Ensure a realistic and diverse distribution of patient profiles across requests, especially for the same location. This includes, but is not limited to:
    *   **Education Levels:** From basic/primary school to well-informed/postgraduate degrees.
    *   **Health Literacy:** From minimal understanding to high medical knowledge.
    *   **Occupations:** Include a wide range, such as university lecturers, doctors, engineers, bankers, accountants, IT specialists, civil servants (all levels), architects, business owners (small to large scale), students, retired executives, as well as artisans, traders, farmers, teachers, taxi/bus drivers, factory workers, etc.
    *   **Socioeconomic Status:** Imply variety through the chosen occupation, residence (as described by \`locationPrompt\`), and general lifestyle/dietary habits in the social history.
    *   **Age and Marital Status:** Vary these naturally and realistically across cases.
3.  **Prioritize Specific Patient Profile Requests:** ${specificPatientProfileRequest ? `**For this specific case, the patient profile must be: "${specificPatientProfileRequest}".** This instruction overrides general diversity guidelines.` : `If no 'specificPatientProfileRequest' is provided (as in this case), then aim for broad and realistic diversity, considering the 'LOCATION CONTEXT' provided.`}

CRITICAL GUIDELINES FOR DIAGNOSIS VARIETY:
1.  **Do NOT Default to Most Common Diagnosis:** Within the specified '${departmentName}' department and "${randomBucket}" pathophysiology category, **do not always generate the single most common condition.**
2.  **Actively Diversify Diagnoses:** Draw from your broad medical knowledge to select a variety of clinically relevant diagnoses within these constraints.
    *   For 'Standard' difficulty, aim for variety among *common* conditions. (e.g., for Obstetrics/Endocrine, vary between Gestational Diabetes, Hypothyroidism in Pregnancy, Hyperthyroidism in Pregnancy, Pre-existing Diabetes in Pregnancy, etc).
    *   For 'Intermediate' and 'Difficult' cases, you may explore less common but still relevant conditions or more complex presentations.
3.  **Avoid Repetition (Sequential Calls):** If generating multiple cases for the same department and bucket, strive to present a *different* diagnosis each time unless explicitly requested otherwise.
4.  **Prioritize Specific Diagnosis Requests:** ${specificDiagnosisRequest ? `**For this specific case, the diagnosis must be: "${specificDiagnosisRequest}".** This instruction overrides general diagnostic diversity guidelines.` : `If no 'specificDiagnosisRequest' is provided, then ensure diagnostic variety within the specified constraints.`}

REQUIREMENTS:
- Pathophysiology category: "${randomBucket}"
- Solvable by medical students
- Balance authenticity with educational value
${isPediatric ? '- Age-appropriate presentation and developmental context' : ''}
${isSurgical ? '- Focus on surgical intervention and context (pre-op, intra-op, post-op considerations where relevant)' : ''}

PATIENT COMMUNICATION GUIDELINES:
- Patients use lay terms, not medical terminology
- Medications are described in common terms (e.g., "blood pressure pills", "diabetes medicine")
- Symptoms are described naturally (e.g., "chest pain", "shortness of breath")
- Avoid patients using exact drug names or dosages unless they have high health literacy or in a specific situation where its a routine medication
- Match communication style to education level and health literacy

EXAMPLES by category (DON'T LIMIT YOURSELF TO THESE):
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

Generate the complete JSON output for this clinical case, ensuring all instructions, especially those for patient profile diversity, location realism, and **diagnostic variety**, are strictly followed.`;
};

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
- Generate a realistic state of origin or city of origin for the patient



EXAMPLES OF GOOD LOCATIONS:
- "I live in Victoria Island, Lagos, near the Lagos University Teaching Hospital"
- "I live in Barnawa close, Makoto"
- "I reside in Ajah estate"
- "My home is in Ungwan Rimi, Kaduna, near the Central Market"

AVOID GENERIC DESCRIPTIONS:
- ❌ "I live in a suburban area of [city]"
- ❌ "I'm from a residential neighborhood"
- ❌ "I live in the city center"
- ❌ "I'm from the outskirts of [city]"
- ✅ Use specific neighborhood names, landmarks, and hospitals

CULTURAL CONSIDERATIONS: Use diverse culturally authentic names, consider local healthcare systems, regional factors, socioeconomic diversity`
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