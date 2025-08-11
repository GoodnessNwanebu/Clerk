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
        
        // Create patient context from demographics and presenting symptoms
        const patientContext = `Patient: ${caseDetails.patientProfile?.age || 'unknown age'} year old ${caseDetails.patientProfile?.gender || 'patient'}. Presenting symptoms: ${caseDetails.patientProfile?.presentingComplaint || 'various symptoms'}.`;
        
        const userMessage = examinationResultsPrompt(plan, patientContext);

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