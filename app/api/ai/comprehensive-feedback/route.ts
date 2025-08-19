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

            // Use secure primary context from cache instead of frontend case details
            const { primaryContext } = sessionContext;
            
            // Validate required data - check for final diagnosis in caseState or fallback to primary context diagnosis
            const finalDiagnosis = caseState.finalDiagnosis || primaryContext.diagnosis;
            if (!finalDiagnosis || !caseState.department) {
                return NextResponse.json({ 
                    error: 'Missing required case data for comprehensive feedback' 
                }, { status: 400 });
            }

            // Create the caseState with primary context for the AI prompt
            const fullCaseState = {
                ...caseState,
                finalDiagnosis: finalDiagnosis, // Ensure final diagnosis is included
                caseDetails: primaryContext // Use primary context as caseDetails
            };

            const aiContext = 'getComprehensiveFeedback';
            const surgicalTeachingContext = getSurgicalTeachingContext(fullCaseState);
            const userMessage = comprehensiveFeedbackPrompt(fullCaseState, surgicalTeachingContext);

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