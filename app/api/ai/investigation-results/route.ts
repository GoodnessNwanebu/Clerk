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
        
        // Extract age information for pediatric cases
        let patientAge: number | null = null;
        let ageGroup: string | null = null;
        
        if (caseDetails.isPediatric && caseDetails.pediatricProfile) {
            patientAge = caseDetails.pediatricProfile.patientAge;
            ageGroup = caseDetails.pediatricProfile.ageGroup;
        }
        
        // Create patient context from demographics and presenting symptoms
        const patientContext = `Patient: ${caseDetails.patientProfile?.age || 'unknown age'} year old ${caseDetails.patientProfile?.gender || 'patient'}. Presenting symptoms: ${caseDetails.patientProfile?.presentingComplaint || 'various symptoms'}.`;
        
        const userMessage = investigationResultsPrompt(plan, patientContext, patientAge, ageGroup);

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