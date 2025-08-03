import { NextRequest, NextResponse } from 'next/server';
import { CaseState, ComprehensiveFeedback } from '../../../../types';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai-utils';
import { comprehensiveFeedbackPrompt, getSurgicalTeachingContext } from '../../../../lib/prompts/feedback';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { caseState, essentialInfo } = body;
        
        if (!caseState) {
            return NextResponse.json({ error: 'Case state is required' }, { status: 400 });
        }

        // Validate required data
        if (!caseState.department || !caseState.caseDetails) {
            return NextResponse.json({ 
                error: 'Missing required case data for comprehensive feedback' 
            }, { status: 400 });
        }

        const context = 'getComprehensiveFeedback';
        const surgicalTeachingContext = getSurgicalTeachingContext(caseState);
        const userMessage = comprehensiveFeedbackPrompt(caseState, surgicalTeachingContext);

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        if (!response.text) {
            throw new Error('AI response was empty');
        }
        
        const comprehensiveFeedback = parseJsonResponse<ComprehensiveFeedback>(response.text, context);
        
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
} 