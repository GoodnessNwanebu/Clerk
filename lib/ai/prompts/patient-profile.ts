export const patientProfilePrompt = (diagnosis: string, departmentName: string, timeContext: string, userCountry: string, randomSeed: number) => {
    return `Generate patient profile for ${diagnosis} in ${departmentName}.
${timeContext}

RANDOM SEED: ${randomSeed} (use for variety, but follow anti-bias requirements above)

REALISTIC PATIENT CHARACTERISTICS:
- Patients typically use common names for medications (e.g., "blood pressure pills" not "amlodipine")
- Patients rarely know exact drug names or dosages
- Patients describe symptoms in lay terms, not medical terminology
- Education level should influence medical knowledge and communication style

LOGICAL CONSISTENCY:
Ensure all patient profile variables are logically consistent with each other. Use common sense and realistic combinations.

OUTPUT: {
    "educationLevel": "basic" | "moderate" | "well-informed",
    "healthLiteracy": "minimal" | "average" | "high", 
    "occupation": string,
    "recordKeeping": "detailed" | "basic" | "minimal"
}

The random seed should produce different profiles for similar cases while maintaining diversity requirements.`;
}; 