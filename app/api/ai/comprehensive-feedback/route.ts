import { NextRequest, NextResponse } from 'next/server';
import { CaseState, ComprehensiveFeedback } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { comprehensiveFeedbackPrompt, getSurgicalTeachingContext } from '../../../../lib/ai/prompts/feedback';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';

export async function POST(request: NextRequest) {
    return requireActiveSession(request, async (sessionContext: SessionMiddlewareContext) => {
        try {
            const { caseState } = sessionContext.requestBody || {};
            
            if (!caseState) {
                return NextResponse.json({ error: 'Case state is required' }, { status: 400 });
            }

            // Validate required data
            if (!caseState.department || !caseState.caseDetails) {
                return NextResponse.json({ 
                    error: 'Missing required case data for comprehensive feedback' 
                }, { status: 400 });
            }

            const aiContext = 'getComprehensiveFeedback';
            const surgicalTeachingContext = getSurgicalTeachingContext(caseState);
            const userMessage = comprehensiveFeedbackPrompt(caseState, surgicalTeachingContext);

            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            if (!response.text) {
                throw new Error('AI response was empty');
            }
            
            const comprehensiveFeedback = parseJsonResponse<ComprehensiveFeedback>(response.text, aiContext);
            
            // Validate the response structure
            const requiredFields = [
                'diagnosis', 
                'keyLearningPoint', 
                'whatYouDidWell', 
                'clinicalReasoning',
                'clinicalOpportunities',
                'clinicalPearls'
            ];
            const missingFields = requiredFields.filter(field => !(field in comprehensiveFeedback));
            
            if (missingFields.length > 0) {
                throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
            }
            
            return NextResponse.json(comprehensiveFeedback);
        } catch (error) {
            return handleApiError(error, 'getComprehensiveFeedback');
        }
    });
} 