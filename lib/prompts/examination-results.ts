export const examinationResultsPrompt = (plan: string, diagnosis: string) =>
`Parse examination plan for patient with diagnosis '${diagnosis}'.
Return consolidated examination reports as JSON array:

QUANTITATIVE: {"name": string, "type": "quantitative", "category": "vital_signs"|"system_examination"|"special_tests", "urgency": "routine"|"urgent"|"critical", "value": number, "unit": string, "range": {"low": number, "high": number}, "status": "Normal"|"High"|"Low"|"Critical"}

DESCRIPTIVE: {"name": string, "type": "descriptive", "category": "vital_signs"|"system_examination"|"special_tests", "urgency": "routine"|"urgent"|"critical", "findings": string, "impression": string, "recommendation": string, "abnormalFlags": string[], "reportType": "cardiovascular"|"respiratory"|"abdominal"|"neurological"|"musculoskeletal"|"general"|"obstetric"|"pediatric"}

GUIDELINES:
- CONSOLIDATE examinations into comprehensive reports
- Each examination type = ONE comprehensive report
- Include inspection, palpation, percussion, auscultation in ONE report
- ALWAYS generate vital signs as separate quantitative results:
  * BP: systolic/diastolic (120/80 mmHg, range 90-140/60-90)
  * HR: bpm (72 bpm, range 60-100)
  * Temp: Celsius (37.2°C, range 36.5-37.5)
  * RR: bpm (16 bpm, range 12-20)
  * O2 Sat: % (98%, range 95-100)
- Make some vital signs abnormal for educational value
- Use professional medical terminology
- Consider patient age, gender, underlying condition

EXAMPLES:
- "cardiovascular examination" → ONE report with ALL cardiac findings
- "respiratory examination" → ONE report with ALL respiratory findings
- "abdominal examination" → ONE report with ALL abdominal findings
- "neurological examination" → ONE report with ALL neurological findings

OUTPUT: {"results": [...]}

Plan: "${plan}"`; 