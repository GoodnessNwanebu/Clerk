export const patientProfilePrompt = (diagnosis: string, departmentName: string, timeContext: string, randomSeed: number) =>
`Generate patient profile for ${diagnosis} in ${departmentName}.
${timeContext}

RANDOM SEED: ${randomSeed}

DIVERSITY REQUIREMENTS:
- Use the random seed to ensure variety
- Education: Randomly choose with equal probability (basic/moderate/well-informed)
- Health Literacy: Randomly choose with equal probability (minimal/average/high)
- Occupation: Choose realistically based on education level
- Record Keeping: Correlate with health literacy (high literacy = detailed records)

OUTPUT: {
    "educationLevel": "basic" | "moderate" | "well-informed",
    "healthLiteracy": "minimal" | "average" | "high", 
    "occupation": string,
    "recordKeeping": "detailed" | "basic" | "minimal"
}

The random seed should produce different profiles for similar cases.`; 