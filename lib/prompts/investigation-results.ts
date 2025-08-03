export const investigationResultsPrompt = (plan: string, diagnosis: string) =>
`Parse investigation plan for patient with diagnosis '${diagnosis}'.
Return JSON array with two formats:

QUANTITATIVE: {"name": string, "type": "quantitative", "category": "laboratory"|"specialized", "urgency": "routine"|"urgent"|"critical", "value": number, "unit": string, "range": {"low": number, "high": number}, "status": "Normal"|"High"|"Low"|"Critical"}

DESCRIPTIVE: {"name": string, "type": "descriptive", "category": "imaging"|"pathology"|"specialized", "urgency": "routine"|"urgent"|"critical", "findings": string, "impression": string, "recommendation": string, "abnormalFlags": string[], "reportType": "radiology"|"pathology"|"ecg"|"echo"|"specialist"}

GUIDELINES:
- Medically plausible results consistent with diagnosis
- FBC: Hemoglobin, PCV, WBC, Platelets (quantitative)
  * PCV range: 36-46% (females), 40-50% (males)
  * Hemoglobin range: 12-16 g/dL (females), 13-17 g/dL (males)
- U&E: Sodium, Potassium, Urea, Creatinine (quantitative)
- LFT: Bilirubin, ALT, AST (quantitative)
- Imaging: Detailed reports with findings and impressions
- ECGs: Professional interpretation with rhythm, axis, intervals
- Echo: Structured cardiac findings with measurements
- Include ALL requested tests
- Make some results abnormal for educational value
- Use professional medical terminology

OUTPUT: {"results": [...]}

Plan: "${plan}"`; 