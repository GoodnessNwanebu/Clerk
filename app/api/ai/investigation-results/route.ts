import { NextRequest, NextResponse } from 'next/server';
import { Case, InvestigationResult } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai-utils';
import { investigationResultsPrompt } from '../../../../lib/prompts/investigation-results';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { plan, caseDetails } = body;
        
        if (!plan || !caseDetails) {
            return NextResponse.json({ error: 'Plan and case details are required' }, { status: 400 });
        }

        const context = 'getInvestigationResults';
        const userMessage = investigationResultsPrompt(plan, caseDetails.diagnosis);

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const jsonResponse = parseJsonResponse<{results: InvestigationResult[]}>(response.text, context);
        return NextResponse.json(jsonResponse.results || []);
    } catch (error) {
        return handleApiError(error, 'getInvestigationResults');
    }
} 