import { NextRequest, NextResponse } from 'next/server';
import { InvestigationResult } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { investigationResultsPrompt } from '../../../../lib/ai/prompts/investigation-results';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';

export async function POST(request: NextRequest) {
    return requireActiveSession(request, async (sessionContext: SessionMiddlewareContext) => {
        try {
            const { plan } = sessionContext.requestBody || {};
            
            if (!plan) {
                return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
            }

            const aiContext = 'getInvestigationResults';
            
            // Use secure primary context from JWT instead of frontend case details
            const { primaryContext } = sessionContext;
            
            // Extract age information for pediatric cases
            let patientAge: number | null = null;
            let ageGroup: string | null = null;
            
            if (primaryContext.isPediatric && primaryContext.pediatricProfile) {
                patientAge = primaryContext.pediatricProfile.patientAge;
                ageGroup = primaryContext.pediatricProfile.ageGroup;
            }
            
            // Extract patient context from primaryInfo (which contains biodata)
            // The primaryInfo contains markdown-formatted patient information
            const patientContext = `Patient case: ${primaryContext.primaryInfo}`;
            
            const userMessage = investigationResultsPrompt(plan, patientContext, patientAge, ageGroup);

            const response = await ai.generateContent({
                model: MODEL,
                contents: [{ text: userMessage }],
            });
            
            const jsonResponse = parseJsonResponse<{results: InvestigationResult[]}>(response.text, aiContext);
            return NextResponse.json(jsonResponse.results || []);
        } catch (error) {
            return handleApiError(error, 'getInvestigationResults');
        }
    });
} 