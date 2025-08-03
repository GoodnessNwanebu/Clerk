import { NextRequest, NextResponse } from 'next/server';
import { Case, Message, PatientResponse } from '../../../../types';
import { getTimeContext } from '../../../../utils/timeContext';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai-utils';
import { 
    patientResponsePrompt, 
    getPediatricSystemInstruction, 
    getAdultSystemInstruction 
} from '../../../../lib/prompts/patient-response';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { history, caseDetails, userCountry, essentialInfo } = body;
        
        if (!history || !caseDetails) {
            return NextResponse.json({ error: 'History and case details are required' }, { status: 400 });
        }

        const context = 'getPatientResponse';
        
        // Determine if this is a pediatric case
        const isPediatric = caseDetails.isPediatric || caseDetails.pediatricProfile;
        
        // Get time context for temporal awareness in patient responses
        const timeContext = getTimeContext(userCountry);
        
        let systemInstruction = '';
        
        if (isPediatric && caseDetails.pediatricProfile) {
            const { patientAge, ageGroup, respondingParent, parentProfile, developmentalStage, communicationLevel } = caseDetails.pediatricProfile;
            
            systemInstruction = getPediatricSystemInstruction(
                timeContext.formattedContext,
                patientAge,
                ageGroup,
                respondingParent,
                parentProfile,
                developmentalStage,
                communicationLevel
            ) + `\n\nPRIMARY_INFORMATION:\n${caseDetails.primaryInfo}`;
        } else {
            // Regular adult case
            systemInstruction = getAdultSystemInstruction(
                timeContext.formattedContext,
                caseDetails.diagnosis,
                caseDetails.primaryInfo
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
        
        if (isPediatric) {
            // Parse the JSON response for pediatric cases
            const responseJson = parseJsonResponse<PatientResponse>(response.text, context);
            return NextResponse.json(responseJson);
        } else {
            // For regular cases, return the simple format
            return NextResponse.json({ 
                messages: [{
                    response: response.text.trim(),
                    sender: 'patient',
                    speakerLabel: ''
                }]
            });
        }
    } catch (error) {
        return handleApiError(error, 'getPatientResponse');
    }
} 