import { NextRequest, NextResponse } from 'next/server';
import { PatientProfile } from '../../../../types';
import { getTimeContext } from '../../../../utils/timeContext';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai-utils';
import { patientProfilePrompt } from '../../../../lib/prompts/patient-profile';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { diagnosis, departmentName, userCountry, randomSeed } = body;
        
        if (!diagnosis || !departmentName) {
            return NextResponse.json({ error: 'Diagnosis and department name are required' }, { status: 400 });
        }

        const context = 'generatePatientProfile';
        
        // Get time context for temporal awareness
        const timeContext = getTimeContext(userCountry);

        // Use provided random seed or generate a new one
        const seed = randomSeed || Math.floor(Math.random() * 10000);

        const userMessage = patientProfilePrompt(diagnosis, departmentName, timeContext.formattedContext, seed);

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const profileJson = parseJsonResponse<PatientProfile>(response.text, context);
        return NextResponse.json(profileJson);
    } catch (error) {
        return handleApiError(error, 'generatePatientProfile');
    }
} 