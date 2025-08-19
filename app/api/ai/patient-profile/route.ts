import { NextRequest, NextResponse } from 'next/server';
import { PatientProfile } from '../../../../types';
import { getTimeContext } from '../../../../lib/shared/timeContext';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { patientProfilePrompt } from '../../../../lib/ai/prompts/patient-profile';
import { requireActiveSession } from '../../../../lib/middleware/jwt-middleware';
import type { JWTMiddlewareContext } from '../../../../lib/middleware/jwt-middleware';

export async function POST(request: NextRequest) {
    return requireActiveSession(request, async (jwtContext: JWTMiddlewareContext) => {
        try {
            const body = await request.json();
            const { userCountry, randomSeed } = body;
            
            const aiContext = 'generatePatientProfile';
            
            // Use secure primary context from JWT instead of frontend parameters
            const { primaryContext } = jwtContext;
            
            // Get time context for temporal awareness
            const timeContext = getTimeContext(userCountry);

            // Use provided random seed or generate a new one
            const seed = randomSeed || Math.floor(Math.random() * 10000);

            const userMessage = patientProfilePrompt(
                primaryContext.diagnosis, 
                primaryContext.department, 
                timeContext.formattedContext, 
                seed
            );

            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            const profileJson = parseJsonResponse<PatientProfile>(response.text, aiContext);
            return NextResponse.json(profileJson);
        } catch (error) {
            return handleApiError(error, 'generatePatientProfile');
        }
    });
} 