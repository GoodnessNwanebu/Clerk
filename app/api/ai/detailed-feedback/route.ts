import { NextRequest, NextResponse } from 'next/server';
import { CaseState, ConsultantTeachingNotes } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { detailedFeedbackPrompt, getSurgicalTeachingContext } from '../../../../lib/ai/prompts/feedback';
import { requireActiveSession } from '../../../../lib/middleware/jwt-middleware';
import type { JWTMiddlewareContext } from '../../../../lib/middleware/jwt-middleware';

export async function POST(request: NextRequest) {
    return requireActiveSession(request, async (jwtContext: JWTMiddlewareContext) => {
        try {
            const body = await request.json();
            const { caseState } = body;
            
            if (!caseState) {
                return NextResponse.json({ error: 'Case state is required' }, { status: 400 });
            }

            // Validate required data
            if (!caseState.department || !caseState.caseDetails) {
                return NextResponse.json({ 
                    error: 'Missing required case data for detailed feedback' 
                }, { status: 400 });
            }

            const aiContext = 'getDetailedCaseFeedback';
            const surgicalTeachingContext = getSurgicalTeachingContext(caseState);
            const userMessage = detailedFeedbackPrompt(caseState, surgicalTeachingContext);

            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            if (!response.text) {
                throw new Error('AI response was empty');
            }
            
            const teachingNotes = parseJsonResponse<ConsultantTeachingNotes>(response.text, aiContext);
            
            // Validate the response structure
            const requiredFields = ['diagnosis', 'keyLearningPoint', 'clerkingStructure', 'missedOpportunities', 'clinicalReasoning', 'communicationNotes', 'clinicalPearls'];
            const missingFields = requiredFields.filter(field => !(field in teachingNotes));
            
            if (missingFields.length > 0) {
                throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
            }
            
            return NextResponse.json(teachingNotes);
        } catch (error) {
            return handleApiError(error, 'getDetailedFeedback');
        }
    });
} 