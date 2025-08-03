import { NextRequest, NextResponse } from 'next/server';
import { Case, ExaminationResult } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai-utils';
import { examinationResultsPrompt } from '../../../../lib/prompts/examination-results';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { plan, caseDetails } = body;
        
        if (!plan || !caseDetails) {
            return NextResponse.json({ error: 'Plan and case details are required' }, { status: 400 });
        }

        const context = 'getExaminationResults';
        const userMessage = examinationResultsPrompt(plan, caseDetails.diagnosis);

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const jsonResponse = parseJsonResponse<{results: ExaminationResult[]}>(response.text, context);
        return NextResponse.json(jsonResponse.results || []);
    } catch (error) {
        return handleApiError(error, 'getExaminationResults');
    }
} 