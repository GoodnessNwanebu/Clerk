import { NextRequest, NextResponse } from 'next/server';
import { Message } from '../../../../types';
import { getTimeContext } from '../../../../lib/shared/timeContext';
import { ai, MODEL, handleApiError } from '../../../../lib/ai/ai-utils';
import { 
    patientResponsePrompt, 
    getPediatricSystemInstruction, 
    getAdultSystemInstruction 
} from '../../../../lib/ai/prompts/patient-response';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';

export async function POST(request: NextRequest) {
    return requireActiveSession(request, async (sessionContext: SessionMiddlewareContext) => {
        try {
            const { history, userCountry } = sessionContext.requestBody || {};
            
            if (!history) {
                return NextResponse.json({ error: 'History is required' }, { status: 400 });
            }

            const aiContext = 'getPatientResponse';
            
            // Use secure primary context from cache instead of frontend case details
            const { primaryContext } = sessionContext;
            
            // Determine if this is a pediatric case
            const isPediatric = primaryContext.isPediatric;
            
            // Get time context for temporal awareness in patient responses
            const timeContext = getTimeContext(userCountry);
            
            let systemInstruction = '';
            
            if (isPediatric && primaryContext.pediatricProfile) {
                const { patientAge, ageGroup, respondingParent, parentProfile, developmentalStage, communicationLevel } = primaryContext.pediatricProfile;
                
                systemInstruction = getPediatricSystemInstruction(
                    timeContext.formattedContext,
                    patientAge,
                    ageGroup,
                    respondingParent,
                    parentProfile,
                    developmentalStage,
                    communicationLevel
                ) + `\n\nPRIMARY_INFORMATION:\n${primaryContext.primaryInfo}`;
            } else {
                // Regular adult case
                systemInstruction = getAdultSystemInstruction(
                    timeContext.formattedContext,
                    primaryContext.diagnosis,
                    primaryContext.primaryInfo
                );
            }
            
            // Convert the history to a format suitable for the API
            const conversation = history
                .filter((msg: Message) => msg.sender === 'student' || msg.sender === 'patient' || msg.sender === 'parent')
                .map((msg: Message) => `${msg.sender === 'student' ? 'STUDENT' : msg.sender === 'parent' ? 'PARENT' : 'PATIENT'}: ${msg.text}`)
                .join('\n\n');
            
            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ 
                    text: patientResponsePrompt(systemInstruction, conversation, !!isPediatric)
                }],
            });
            
            // Always treat response as plain text - no more JSON parsing issues
            return NextResponse.json({ 
                messages: [{
                    response: response.text.trim(),
                    sender: 'patient',
                    speakerLabel: ''
                }]
            });
        } catch (error) {
            return handleApiError(error, 'getPatientResponse');
        }
    });
} 