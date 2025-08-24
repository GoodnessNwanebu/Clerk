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
                const { 
                    patientAge, 
                    ageGroup, 
                    respondingParent, 
                    parentProfile, 
                    developmentalStage, 
                    communicationLevel,
                    childName
                } = primaryContext.pediatricProfile;
                
                systemInstruction = getPediatricSystemInstruction(
                    timeContext.formattedContext,
                    patientAge,
                    ageGroup,
                    respondingParent,
                    parentProfile,
                    developmentalStage,
                    communicationLevel,
                    childName
                ) + `\n\nPRIMARY_INFORMATION:\n${primaryContext.primaryInfo}`;
            } else {
                // Regular adult case
                systemInstruction = getAdultSystemInstruction(
                    timeContext.formattedContext,
                    primaryContext.diagnosis,
                    primaryContext.primaryInfo
                );
            }
            
            // For pediatric cases, let AI determine speaker naturally
            let speakerLabel = '';
            let sender = 'patient';
            
            if (isPediatric && primaryContext.pediatricProfile) {
                // Don't set hardcoded speaker - let AI decide based on question context
                console.log('🔄 [patient-response] Pediatric case - AI will determine speaker naturally');
            }
            
            // Convert the history to a format suitable for the API
            const conversation = history
                .filter((msg: Message) => msg.sender === 'student' || msg.sender === 'patient' || msg.sender === 'parent')
                .map((msg: Message) => `${msg.sender === 'student' ? 'STUDENT' : msg.sender === 'parent' ? 'PARENT' : 'PATIENT'}: ${msg.text}`)
                .join('\n\n');
            
            const response = await ai.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: [{ 
                    text: patientResponsePrompt(systemInstruction, conversation, !!isPediatric)
                }],
                config: {
                    maxOutputTokens: 200
                }
            });
            

            
            console.log('🔄 [patient-response] Returning message with speakerLabel:', {
                sender: sender,
                speakerLabel: speakerLabel,
                isPediatric: isPediatric,
                responsePreview: response.text.trim().substring(0, 50) + '...'
            });
            
            // Clean the response text and extract speaker label
            let cleanedResponse = response.text.trim();
            let extractedSpeakerLabel = '';
            
            // Try to extract speaker label from AI response
            const speakerMatch = cleanedResponse.match(/^(Child|Mother|Father):\s*/i);
            if (speakerMatch) {
                extractedSpeakerLabel = speakerMatch[1];
                cleanedResponse = cleanedResponse.replace(/^(Child|Mother|Father):\s*/i, '');
            } else {
                // Default to parent if no speaker label found
                extractedSpeakerLabel = isPediatric && primaryContext.pediatricProfile?.respondingParent === 'mother' ? 'Mother' : 'Father';
            }
            
            // Remove markdown formatting
            cleanedResponse = cleanedResponse.replace(/\*\*[^*]+\*\*:\s*/g, '');
            cleanedResponse = cleanedResponse.replace(/\*\*/g, '');
            cleanedResponse = cleanedResponse.trim();
            
            console.log('🔄 [patient-response] Response processing:', {
                original: response.text.trim().substring(0, 100) + '...',
                extractedSpeakerLabel,
                cleaned: cleanedResponse.substring(0, 100) + '...'
            });
            
            return NextResponse.json({ 
                messages: [{
                    response: cleanedResponse,
                    sender: extractedSpeakerLabel.toLowerCase().includes('child') ? 'patient' : 'parent',
                    speakerLabel: extractedSpeakerLabel
                }]
            });
        } catch (error) {
            return handleApiError(error, 'getPatientResponse');
        }
    });
} 