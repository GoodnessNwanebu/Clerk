import { NextRequest, NextResponse } from 'next/server';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { osceEvaluationPrompt } from '../../../../lib/ai/prompts/osce-evaluation';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';
import { OSCEEvaluation, OSCEEvaluationRequest, OSCEEvaluationAPIResponse } from '../../../../types/osce';
import { getOSCEAnswers } from '../../../../lib/cache/osce-answers-cache';
import { getOSCEQuestions } from '../../../../lib/ai/osce-utils';

export async function POST(request: NextRequest) {
  return requireActiveSession(request, async (sessionContext: SessionMiddlewareContext) => {
    try {
      const body = await request.json();
      const { studentResponses, caseState } = body;
      
      if (!studentResponses || !Array.isArray(studentResponses)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Student responses are required' 
        }, { status: 400 });
      }

      if (!caseState) {
        return NextResponse.json({ 
          success: false, 
          error: 'Case state is required' 
        }, { status: 400 });
      }

      const { caseSession, primaryContext } = sessionContext;
      const caseId = caseSession.caseId;

      console.log('🎯 [OSCE Evaluation] Starting evaluation for case:', caseId);

      // Get cached correct answers
      const cachedAnswers = await getOSCEAnswers(caseId);
      if (!cachedAnswers) {
        return NextResponse.json({ 
          success: false, 
          error: 'OSCE answers not found in cache' 
        }, { status: 404 });
      }

      // Get questions from localStorage (we need the question text)
      const questions = getOSCEQuestions(caseId);
      if (!questions) {
        return NextResponse.json({ 
          success: false, 
          error: 'OSCE questions not found' 
        }, { status: 404 });
      }

      // Create full case state for evaluation (merge primary context with secondary context)
      const fullCaseState = {
        ...caseState,
        caseDetails: primaryContext // Use primary context as caseDetails
      };

      const aiContext = 'generateOSCEEvaluation';
      const userMessage = osceEvaluationPrompt(
        fullCaseState,
        studentResponses,
        cachedAnswers.answers,
        questions
      );

      console.log('🤖 [OSCE Evaluation] Sending evaluation request to AI');

      const aiResponse = await ai.generateContent({
        model: MODEL,
        contents: [{ text: userMessage }],
      });
      
      if (!aiResponse.text) {
        throw new Error('AI response was empty');
      }
      
      const osceEvaluation = parseJsonResponse<OSCEEvaluation>(aiResponse.text, aiContext);
      
      // Validate the response structure
      const requiredFields = [
        'diagnosis', 
        'scoreBreakdown', 
        'rationaleForScore',
        'clinicalOpportunities',
        'followupAnswers',
        'clinicalPearls'
      ];
      const missingFields = requiredFields.filter(field => !(field in osceEvaluation));
      
      if (missingFields.length > 0) {
        throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate score breakdown
      const scoreFields = ['historyCoverage', 'relevanceOfQuestions', 'clinicalReasoning', 'followupQuestions', 'overallScore'];
      const missingScoreFields = scoreFields.filter(field => !(field in osceEvaluation.scoreBreakdown));
      
      if (missingScoreFields.length > 0) {
        throw new Error(`Score breakdown missing fields: ${missingScoreFields.join(', ')}`);
      }

      console.log('✅ [OSCE Evaluation] Generated evaluation with overall score:', osceEvaluation.scoreBreakdown.overallScore);

      const response: OSCEEvaluationAPIResponse = {
        success: true,
        evaluation: osceEvaluation
      };

      return NextResponse.json(response);

    } catch (error) {
      console.error('❌ [OSCE Evaluation] Error:', error);
      return handleApiError(error, 'generateOSCEEvaluation');
    }
  });
}
