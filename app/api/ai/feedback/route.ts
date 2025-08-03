import { NextRequest, NextResponse } from 'next/server';
import { CaseState, Feedback } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai-utils';
import { feedbackPrompt, getSurgicalContext } from '../../../../lib/prompts/feedback';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { caseState, essentialInfo } = body;
        
        if (!caseState) {
            return NextResponse.json({ error: 'Case state is required' }, { status: 400 });
        }

        const context = 'getCaseFeedback';
        const userMessage = feedbackPrompt(caseState);

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const feedback = parseJsonResponse<Feedback>(response.text, context);
        return NextResponse.json(feedback);
    } catch (error) {
        return handleApiError(error, 'getFeedback');
    }
} 