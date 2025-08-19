import { NextRequest, NextResponse } from 'next/server';
import { CaseState, Feedback } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { feedbackPrompt, getSurgicalContext } from '../../../../lib/ai/prompts/feedback';
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

            const aiContext = 'getCaseFeedback';
            const userMessage = feedbackPrompt(caseState);

            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            const feedback = parseJsonResponse<Feedback>(response.text, aiContext);
            return NextResponse.json(feedback);
        } catch (error) {
            return handleApiError(error, 'getFeedback');
        }
    });
} 