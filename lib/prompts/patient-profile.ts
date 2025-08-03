export const patientProfilePrompt = (diagnosis: string, departmentName: string, timeContext: string) =>
`Generate patient profile for ${diagnosis} in ${departmentName}.
${timeContext}

OUTPUT: {
    "educationLevel": "basic" | "moderate" | "well-informed",
    "healthLiteracy": "minimal" | "average" | "high", 
    "occupation": string,
    "recordKeeping": "detailed" | "basic" | "minimal"
}

Ensure natural diversity in profiles.`; 