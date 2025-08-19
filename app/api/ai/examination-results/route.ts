import { NextRequest, NextResponse } from 'next/server';
import { ExaminationResult } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { examinationResultsPrompt } from '../../../../lib/ai/prompts/examination-results';
import { requireActiveSession } from '../../../../lib/middleware/jwt-middleware';
import type { JWTMiddlewareContext } from '../../../../lib/middleware/jwt-middleware';

export async function POST(request: NextRequest) {
    return requireActiveSession(request, async (jwtContext: JWTMiddlewareContext) => {
        try {
            const body = await request.json();
            const { plan } = body;
            
            if (!plan) {
                return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
            }

            const aiContext = 'getExaminationResults';
            
            // Use secure primary context from JWT instead of frontend case details
            const { primaryContext } = jwtContext;
            
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