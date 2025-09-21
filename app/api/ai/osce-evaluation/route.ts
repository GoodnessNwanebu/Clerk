import { NextRequest, NextResponse } from 'next/server';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { osceEvaluationPrompt } from '../../../../lib/ai/prompts/osce-evaluation';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';
import { OSCEEvaluation, OSCEEvaluationAPIResponse, OSCEStudentResponse } from '../../../../types/osce';
import { getOSCEAnswers } from '../../../../lib/cache/osce-answers-cache';

export async function POST(request: NextRequest) {
  console.log('🚀 [OSCE Evaluation] Route hit - starting processing...');
  
  return requireActiveSession(request, async (sessionContext: SessionMiddlewareContext) => {
    try {
      console.log('🔍 [OSCE Evaluation] Starting request processing...');
      
      // Get the request body that was already parsed by the middleware
      const body = sessionContext.requestBody || {};
      console.log('🔍 [OSCE Evaluation] Request body received:', {
        hasStudentResponses: !!body.studentResponses,
        studentResponsesLength: body.studentResponses?.length,
        hasCaseState: !!body.caseState,
        caseStateKeys: body.caseState ? Object.keys(body.caseState) : []
      });
      
      // Extract required data from request body
      const { studentResponses, caseState } = body;
      
      // Validate student responses
      if (!studentResponses || !Array.isArray(studentResponses)) {
        console.log('❌ [OSCE Evaluation] Student responses validation failed:', {
          studentResponses: studentResponses,
          isArray: Array.isArray(studentResponses)
        });
        return NextResponse.json({ 
          success: false, 
          error: 'Student responses are required' 
        }, { status: 400 });
      }

      // Validate case state
      if (!caseState) {
        console.log('❌ [OSCE Evaluation] Case state validation failed');
        return NextResponse.json({ 
          success: false, 
          error: 'Case state is required' 
        }, { status: 400 });
      }

      // Get session context
      const { caseSession, primaryContext } = sessionContext;
      const caseId = caseSession.caseId;

      console.log('🎯 [OSCE Evaluation] Starting evaluation for case:', caseId);
      console.log('🔍 [OSCE Evaluation] Session context:', {
        hasCaseSession: !!caseSession,
        hasPrimaryContext: !!primaryContext,
        caseId: caseId
      });

      // Get cached correct answers
      console.log('🔍 [OSCE Evaluation] Fetching cached answers...');
      const cachedAnswers = await getOSCEAnswers(caseId);
      console.log('🔍 [OSCE Evaluation] Cached answers result:', {
        hasCachedAnswers: !!cachedAnswers,
        answersCount: cachedAnswers?.answers ? Object.keys(cachedAnswers.answers).length : 0,
        questionsCount: cachedAnswers?.questionData?.length || 0
      });
      
      if (!cachedAnswers) {
        console.log('❌ [OSCE Evaluation] No cached answers found for case:', caseId);
        return NextResponse.json({ 
          success: false, 
          error: 'OSCE answers not found in cache' 
        }, { status: 404 });
      }

      // Extract questions from cached data
      const questions = cachedAnswers.questionData.map(q => ({
        id: q.id,
        domain: q.domain,
        question: q.question
      }));

      console.log('🔍 [OSCE Evaluation] Questions extracted:', {
        questionsCount: questions.length,
        firstQuestion: questions[0] ? { id: questions[0].id, domain: questions[0].domain } : null
      });

      // Create full case state for evaluation
      const fullCaseState = {
        ...caseState,
        caseDetails: primaryContext
      };

      console.log('🔍 [OSCE Evaluation] Full case state created:', {
        hasCaseDetails: !!fullCaseState.caseDetails,
        caseStateKeys: Object.keys(fullCaseState)
      });

      // Generate evaluation using AI
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
      
      // Validate the AI response structure
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

      // Return successful response
      const response: OSCEEvaluationAPIResponse = {
        success: true,
        evaluation: osceEvaluation
      };

      return NextResponse.json(response);

    } catch (error) {
      console.error('❌ [OSCE Evaluation] Detailed error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      return handleApiError(error, 'generateOSCEEvaluation');
    }
  });
}
