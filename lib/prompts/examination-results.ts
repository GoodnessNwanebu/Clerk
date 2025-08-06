// Helper function to parse examination plan and extract examination scope
const parseExaminationScope = (plan: string): {
    generalExamination: boolean;
    cardiovascular: boolean;
    respiratory: boolean;
    abdominal: boolean;
    neurological: boolean;
    musculoskeletal: boolean;
    otherSystems: string[];
} => {
    const planLower = plan.toLowerCase();
    
    // Define examination types and their keywords
    const examinationTypes = {
        generalExamination: ['general examination', 'general exam', 'basic examination', 'vital signs', 'general appearance'],
        cardiovascular: ['cardiovascular', 'cardiac', 'heart', 'cv examination', 'cv exam'],
        respiratory: ['respiratory', 'chest', 'lung', 'respiratory examination', 'respiratory exam'],
        abdominal: ['abdominal', 'abdomen', 'gastrointestinal', 'gi', 'abdominal examination', 'abdominal exam'],
        neurological: ['neurological', 'neurology', 'neuro', 'neurological examination', 'neurological exam'],
        musculoskeletal: ['musculoskeletal', 'msk', 'orthopedic', 'joint', 'musculoskeletal examination', 'musculoskeletal exam']
    };
    
    // Check for each examination type
    const scope = {
        generalExamination: false,
        cardiovascular: false,
        respiratory: false,
        abdominal: false,
        neurological: false,
        musculoskeletal: false,
        otherSystems: [] as string[]
    };
    
    // Check for general examination (always include if mentioned)
    scope.generalExamination = examinationTypes.generalExamination.some(keyword => 
        planLower.includes(keyword)
    );
    
    // Check for specific system examinations
    scope.cardiovascular = examinationTypes.cardiovascular.some(keyword => 
        planLower.includes(keyword)
    );
    scope.respiratory = examinationTypes.respiratory.some(keyword => 
        planLower.includes(keyword)
    );
    scope.abdominal = examinationTypes.abdominal.some(keyword => 
        planLower.includes(keyword)
    );
    scope.neurological = examinationTypes.neurological.some(keyword => 
        planLower.includes(keyword)
    );
    scope.musculoskeletal = examinationTypes.musculoskeletal.some(keyword => 
        planLower.includes(keyword)
    );
    
    // Check for other systems mentioned
    const otherKeywords = ['obstetric', 'gynecological', 'dermatological', 'psychiatric', 'ophthalmological', 'ent', 'ear nose throat'];
    otherKeywords.forEach(keyword => {
        if (planLower.includes(keyword)) {
            scope.otherSystems.push(keyword);
        }
    });
    
    // If no specific examinations are mentioned, assume general examination only
    if (!scope.generalExamination && !scope.cardiovascular && !scope.respiratory && 
        !scope.abdominal && !scope.neurological && !scope.musculoskeletal && scope.otherSystems.length === 0) {
        scope.generalExamination = true;
    }
    
    return scope;
};

export const examinationResultsPrompt = (plan: string, diagnosis: string) => {
    // Parse the examination scope from the plan
    const examinationScope = parseExaminationScope(plan);
    
    // Generate scope-specific instructions
    const scopeInstructions = generateScopeInstructions(examinationScope);
    
    return `Parse examination plan for patient with diagnosis '${diagnosis}'.
EXAMINATION SCOPE: ${scopeInstructions}

Return consolidated examination reports as JSON array:

QUANTITATIVE: {"name": string, "type": "quantitative", "category": "vital_signs"|"system_examination"|"special_tests", "urgency": "routine"|"urgent"|"critical", "value": number, "unit": string, "range": {"low": number, "high": number}, "status": "Normal"|"High"|"Low"|"Critical"}

DESCRIPTIVE: {"name": string, "type": "descriptive", "category": "vital_signs"|"system_examination"|"special_tests", "urgency": "routine"|"urgent"|"critical", "findings": string, "impression": string, "recommendation": string, "abnormalFlags": string[], "reportType": "cardiovascular"|"respiratory"|"abdominal"|"neurological"|"musculoskeletal"|"general"|"obstetric"|"pediatric"}

GUIDELINES:
- CONSOLIDATE examinations into comprehensive reports
- Each examination type = ONE comprehensive report
- Include inspection, palpation, percussion, auscultation in ONE report
- ALWAYS generate vital signs as separate quantitative results (if general examination is included):
  * BP: systolic/diastolic (120/80 mmHg, range 90-140/60-90)
  * HR: bpm (72 bpm, range 60-100)
  * Temp: Celsius (37.2°C, range 36.5-37.5)
  * RR: bpm (16 bpm, range 12-20)
  * O2 Sat: % (98%, range 95-100)
- Make some vital signs abnormal for educational value
- Use professional medical terminology
- Consider patient age, gender, underlying condition

CRITICAL SCOPE RULES:
- ONLY provide results for examinations that were actually requested
- If student only requested "general examination", provide ONLY vital signs and general appearance
- If student requested "cardiovascular examination", provide ONLY cardiovascular findings
- If student requested "respiratory examination", provide ONLY respiratory findings
- If student requested "abdominal examination", provide ONLY abdominal findings
- If student requested "neurological examination", provide ONLY neurological findings
- If student requested "musculoskeletal examination", provide ONLY musculoskeletal findings
- DO NOT provide findings for systems that were not examined
- DO NOT assume examinations were done if not explicitly requested

EXAMPLES:
- "general examination" → ONLY vital signs and general appearance
- "cardiovascular examination" → ONLY cardiovascular findings
- "respiratory examination" → ONLY respiratory findings
- "abdominal examination" → ONLY abdominal findings
- "neurological examination" → ONLY neurological findings
- "full examination" or "complete examination" → ALL systems

OUTPUT: {"results": [...]}

Plan: "${plan}"`;
};

// Helper function to generate scope-specific instructions
const generateScopeInstructions = (scope: ReturnType<typeof parseExaminationScope>): string => {
    const instructions: string[] = [];
    
    if (scope.generalExamination) {
        instructions.push("General examination (vital signs + general appearance)");
    }
    if (scope.cardiovascular) {
        instructions.push("Cardiovascular examination");
    }
    if (scope.respiratory) {
        instructions.push("Respiratory examination");
    }
    if (scope.abdominal) {
        instructions.push("Abdominal examination");
    }
    if (scope.neurological) {
        instructions.push("Neurological examination");
    }
    if (scope.musculoskeletal) {
        instructions.push("Musculoskeletal examination");
    }
    if (scope.otherSystems.length > 0) {
        instructions.push(`Other systems: ${scope.otherSystems.join(', ')}`);
    }
    
    if (instructions.length === 0) {
        return "General examination only (default)";
    }
    
    return instructions.join(', ');
}; 