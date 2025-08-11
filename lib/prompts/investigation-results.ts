export const investigationResultsPrompt = (plan: string, patientContext: string, patientAge?: number | null, ageGroup?: string | null) => {
    // Generate age-specific reference ranges for pediatric cases
    const ageSpecificRanges = patientAge && ageGroup ? getAgeSpecificRanges(patientAge, ageGroup) : '';
    
    return `Generate investigation results for a patient based on their presenting symptoms and clinical context.
PATIENT CONTEXT: ${patientContext}
${patientAge ? `PATIENT AGE: ${patientAge} years old (${ageGroup})` : ''}
${ageSpecificRanges}

Return JSON array with two formats:

QUANTITATIVE: {"name": string, "type": "quantitative", "category": "laboratory"|"specialized", "urgency": "routine"|"urgent"|"critical", "value": number, "unit": string, "range": {"low": number, "high": number}, "status": "Normal"|"High"|"Low"|"Critical"}

DESCRIPTIVE: {"name": string, "type": "descriptive", "category": "imaging"|"pathology"|"specialized", "urgency": "routine"|"urgent"|"critical", "findings": string, "impression": string, "recommendation": string, "abnormalFlags": string[], "reportType": "radiology"|"pathology"|"ecg"|"echo"|"specialist"}

GUIDELINES:
- Generate medically plausible results based on patient's presenting symptoms
- Results should be consistent with the patient's condition but not reveal the diagnosis
- FBC: Hemoglobin, PCV, WBC, Platelets (quantitative)
  * PCV range: 36-46% (females), 40-50% (males)
  * Hemoglobin range: 12-16 g/dL (females), 13-17 g/dL (males)
- U&E: Sodium, Potassium, Urea, Creatinine (quantitative)
- LFT: Bilirubin, ALT, AST (quantitative)
- Imaging: Detailed reports with findings and impressions
- ECGs: Professional interpretation with rhythm, axis, intervals
- Echo: Structured cardiac findings with measurements
- Include ALL requested tests
- Make some results abnormal if consistent with presenting symptoms
- Use professional medical terminology
${patientAge ? `- Use age-appropriate reference ranges for pediatric patients` : ''}

OUTPUT: {"results": [...]}

Plan: "${plan}"`;
};

// Helper function to generate age-specific reference ranges
const getAgeSpecificRanges = (age: number, ageGroup: string): string => {
    let ranges = `\nAGE-SPECIFIC REFERENCE RANGES (${ageGroup}):\n`;
    
    // Vital signs by age
    if (age <= 1) {
        ranges += `- Heart Rate: 120-160 bpm (normal for infants)\n`;
        ranges += `- Blood Pressure: 70-90/50-65 mmHg (normal for infants)\n`;
        ranges += `- Respiratory Rate: 30-60 breaths/min (normal for infants)\n`;
        ranges += `- Temperature: 36.5-37.5°C (slightly higher normal range)\n`;
    } else if (age <= 3) {
        ranges += `- Heart Rate: 100-140 bpm (normal for toddlers)\n`;
        ranges += `- Blood Pressure: 80-110/55-75 mmHg (normal for toddlers)\n`;
        ranges += `- Respiratory Rate: 24-40 breaths/min (normal for toddlers)\n`;
        ranges += `- Temperature: 36.5-37.5°C\n`;
    } else if (age <= 6) {
        ranges += `- Heart Rate: 80-120 bpm (normal for preschoolers)\n`;
        ranges += `- Blood Pressure: 85-115/55-75 mmHg (normal for preschoolers)\n`;
        ranges += `- Respiratory Rate: 20-30 breaths/min (normal for preschoolers)\n`;
        ranges += `- Temperature: 36.5-37.5°C\n`;
    } else if (age <= 12) {
        ranges += `- Heart Rate: 70-110 bpm (normal for school-age children)\n`;
        ranges += `- Blood Pressure: 90-120/60-80 mmHg (normal for school-age children)\n`;
        ranges += `- Respiratory Rate: 18-25 breaths/min (normal for school-age children)\n`;
        ranges += `- Temperature: 36.5-37.5°C\n`;
    } else {
        ranges += `- Heart Rate: 60-100 bpm (approaching adult ranges)\n`;
        ranges += `- Blood Pressure: 95-125/65-85 mmHg (approaching adult ranges)\n`;
        ranges += `- Respiratory Rate: 16-20 breaths/min (approaching adult ranges)\n`;
        ranges += `- Temperature: 36.5-37.5°C\n`;
    }
    
    // Laboratory values by age
    if (age <= 1) {
        ranges += `- Hemoglobin: 10-14 g/dL (lower normal range for infants)\n`;
        ranges += `- WBC: 6-17.5 x10^9/L (higher normal range for infants)\n`;
        ranges += `- Creatinine: 0.2-0.4 mg/dL (lower normal range for infants)\n`;
    } else if (age <= 6) {
        ranges += `- Hemoglobin: 11-14 g/dL (normal for young children)\n`;
        ranges += `- WBC: 5-15.5 x10^9/L (normal for young children)\n`;
        ranges += `- Creatinine: 0.3-0.7 mg/dL (normal for young children)\n`;
    } else if (age <= 12) {
        ranges += `- Hemoglobin: 11.5-15.5 g/dL (approaching adult ranges)\n`;
        ranges += `- WBC: 4.5-13.5 x10^9/L (approaching adult ranges)\n`;
        ranges += `- Creatinine: 0.4-0.9 mg/dL (approaching adult ranges)\n`;
    } else {
        ranges += `- Hemoglobin: 12-16 g/dL (adult ranges)\n`;
        ranges += `- WBC: 4-11 x10^9/L (adult ranges)\n`;
        ranges += `- Creatinine: 0.5-1.2 mg/dL (adult ranges)\n`;
    }
    
    return ranges;
}; 