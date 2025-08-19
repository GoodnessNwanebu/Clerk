import { NextRequest, NextResponse } from 'next/server';
import { ExaminationResult } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { examinationResultsPrompt } from '../../../../lib/ai/prompts/examination-results';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';

export async function POST(request: NextRequest) {
    return requireActiveSession(request, async (sessionContext: SessionMiddlewareContext) => {
        try {
            const { plan } = sessionContext.requestBody || {};
            
            if (!plan) {
                return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
            }

            const aiContext = 'getExaminationResults';
            
            // Use secure primary context from JWT instead of frontend case details
            const { primaryContext } = sessionContext;
            
            // Extract patient context from primaryInfo (which contains biodata)
            // The primaryInfo contains markdown-formatted patient information
            const patientContext = `Patient case: ${primaryContext.primaryInfo}`;
            
            const userMessage = examinationResultsPrompt(plan, patientContext);

            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            const jsonResponse = parseJsonResponse<{results: ExaminationResult[]}>(response.text, aiContext);
            return NextResponse.json(jsonResponse.results || []);
        } catch (error) {
            return handleApiError(error, 'getExaminationResults');
        }
    });
} 