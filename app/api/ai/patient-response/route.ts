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
            
            // Determine speaker for pediatric cases BEFORE generating response
            let speakerLabel = '';
            let sender = 'patient';
            
            if (isPediatric && primaryContext.pediatricProfile) {
                const { respondingParent, patientAge, ageGroup, communicationLevel } = primaryContext.pediatricProfile;
                
                // Get the last student question to determine who should respond
                const lastStudentMessage = history
                    .filter((msg: Message) => msg.sender === 'student')
                    .pop();
                
                if (lastStudentMessage) {
                    const questionText = lastStudentMessage.text.toLowerCase();
                    
                    // Determine who should respond based on question type and child's age
                    const shouldChildRespond = (
                        // Only allow child responses for school-age children and adolescents
                        (ageGroup === 'school-age' || ageGroup === 'adolescent') &&
                        communicationLevel !== 'non-verbal' &&
                        (
                            // Questions about current symptoms the child can describe
                            (questionText.includes('pain') || questionText.includes('hurt') || questionText.includes('sore')) ||
                            (questionText.includes('feel') && (questionText.includes('now') || questionText.includes('today'))) ||
                            (questionText.includes('symptom') && (questionText.includes('current') || questionText.includes('now'))) ||
                            // Questions about activities and preferences
                            (questionText.includes('like') || questionText.includes('enjoy') || questionText.includes('play')) ||
                            (questionText.includes('activity') || questionText.includes('hobby')) ||
                            // Simple yes/no questions about current state (but not identity questions)
                            ((questionText.includes('can you') || questionText.includes('do you') || questionText.includes('are you')) && 
                             !questionText.includes('name') && !questionText.includes('brings') && !questionText.includes('come')) ||
                            // Questions directly to the child (but not identity questions)
                            (questionText.includes('child') || questionText.includes('patient')) ||
                            // Age-appropriate questions for older children
                            (patientAge >= 6 && (questionText.includes('school') || questionText.includes('friend')))
                        ) &&
                        (
                            // Exclude questions directed to parents with formal titles
                            !questionText.includes('madam') && 
                            !questionText.includes('ma') && 
                            !questionText.includes('sir')
                        )
                    );
                    
                    if (shouldChildRespond) {
                        speakerLabel = 'Child';
                        sender = 'patient';
                    } else {
                        // Parent responds to everything else
                        speakerLabel = respondingParent === 'mother' ? 'Mother' : 'Father';
                        sender = 'parent';
                    }
                } else {
                    // Default to responding parent if no question found
                    speakerLabel = respondingParent === 'mother' ? 'Mother' : 'Father';
                    sender = 'parent';
                }
                
                console.log('🔄 [patient-response] Pediatric case - determined speaker:', {
                    question: lastStudentMessage?.text.substring(0, 50) + '...',
                    patientAge,
                    ageGroup,
                    communicationLevel,
                    respondingParent,
                    determinedSpeakerLabel: speakerLabel,
                    determinedSender: sender
                });
            } else {
                console.log('🔄 [patient-response] Non-pediatric case or missing pediatric profile');
            }
            
            // Convert the history to a format suitable for the API
            const conversation = history
                .filter((msg: Message) => msg.sender === 'student' || msg.sender === 'patient' || msg.sender === 'parent')
                .map((msg: Message) => `${msg.sender === 'student' ? 'STUDENT' : msg.sender === 'parent' ? 'PARENT' : 'PATIENT'}: ${msg.text}`)
                .join('\n\n');
            
            // Add speaker instruction to the prompt for pediatric cases
            const speakerInstruction = isPediatric && speakerLabel ? 
                `\n\nIMPORTANT: Respond as ${speakerLabel}. ${speakerLabel === 'Child' ? 'Speak like a child of this age.' : 'Speak like a concerned parent.'}` : '';
            
            console.log('🔄 [patient-response] Using AI model:', 'gemini-2.5-flash');
            
            const response = await ai.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ 
                    text: patientResponsePrompt(systemInstruction, conversation, !!isPediatric) + speakerInstruction
                }],
                config: {
                    maxOutputTokens: 350
                }
            });
            

            
            console.log('🔄 [patient-response] Returning message with speakerLabel:', {
                sender: sender,
                speakerLabel: speakerLabel,
                isPediatric: isPediatric,
                responsePreview: response.text.trim().substring(0, 50) + '...'
            });
            
            // Clean the response text - remove markdown formatting and speaker prefixes
            let cleanedResponse = response.text.trim();
            
            // Remove markdown formatting like **speaker:** or **dare:**
            cleanedResponse = cleanedResponse.replace(/\*\*[^*]+\*\*:\s*/g, '');
            
            // Remove any remaining markdown formatting
            cleanedResponse = cleanedResponse.replace(/\*\*/g, '');
            
            // Remove any speaker prefixes like "Mother:" or "Child:"
            cleanedResponse = cleanedResponse.replace(/^(mother|father|child|patient):\s*/i, '');
            
            // Clean up any extra whitespace
            cleanedResponse = cleanedResponse.trim();
            
            console.log('🔄 [patient-response] Response cleaning:', {
                original: response.text.trim().substring(0, 100) + '...',
                cleaned: cleanedResponse.substring(0, 100) + '...'
            });
            
            return NextResponse.json({ 
                messages: [{
                    response: cleanedResponse,
                    sender: sender as 'patient' | 'parent',
                    speakerLabel: speakerLabel
                }]
            });
        } catch (error) {
            return handleApiError(error, 'getPatientResponse');
        }
    });
} 