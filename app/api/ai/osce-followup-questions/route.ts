import { NextRequest, NextResponse } from 'next/server';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import { osceFollowupQuestionsPrompt } from '../../../../lib/ai/prompts/osce-followup-questions';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';
import { OSCEQuestionWithAnswer, OSCEFollowupQuestionsResponse } from '../../../../types/osce';
import { cacheOSCEAnswers } from '../../../../lib/cache/osce-answers-cache';

interface OSCEFollowupAIResponse {
  questions: OSCEQuestionWithAnswer[];
}

export async function POST(request: NextRequest) {
  return requireActiveSession(request, async (sessionContext: SessionMiddlewareContext) => {
    try {
      const aiContext = 'generateOSCEFollowupQuestions';
      
      // Use secure primary context from cache
      const { primaryContext } = sessionContext;
      
      console.log('🎯 [OSCE Follow-up] Generating questions for:', {
        diagnosis: primaryContext.diagnosis,
        department: primaryContext.department
      });

      // Extract patient demographics if available from primary context
      // For pediatric cases, age is in pediatricProfile
      const patientAge = primaryContext.pediatricProfile?.patientAge;
      // Gender information would be extracted from primaryInfo text if needed
      const patientGender = undefined; // Will be extracted from case text by AI

      const userMessage = osceFollowupQuestionsPrompt(
        primaryContext.diagnosis,
        primaryContext.primaryInfo,
        primaryContext.department,
        patientAge,
        patientGender
      );

      const aiResponse = await ai.generateContent({
        model: MODEL,
        contents: [{ text: userMessage }],
      });
      
      console.log('🤖 [OSCE Follow-up] AI Response received');
      
      const osceData = parseJsonResponse<OSCEFollowupAIResponse>(aiResponse.text, aiContext);
      
      if (!osceData.questions || osceData.questions.length !== 10) {
        throw new Error('Invalid OSCE questions format - expected exactly 10 questions');
      }

      // Validate each question has required fields with strong typing
      osceData.questions.forEach((question, index) => {
        if (!question.id || !question.domain || !question.question || !question.answer) {
          throw new Error(`Question ${index + 1} is missing required fields`);
        }
        if (typeof question.id !== 'string' || typeof question.question !== 'string' || typeof question.answer !== 'string') {
          throw new Error(`Question ${index + 1} has invalid field types`);
        }
      });

      console.log('✅ [OSCE Follow-up] Generated', osceData.questions.length, 'questions');

      // Store answers in server-side cache/session for later evaluation
      // We'll return questions without answers to frontend
      const questionsForFrontend = osceData.questions.map(q => ({
        id: q.id,
        domain: q.domain,
        question: q.question
      }));

      // Cache the complete questions with answers using Next.js cache
      await cacheOSCEAnswers(sessionContext.caseSession.caseId, osceData.questions);
      console.log('✅ [OSCE Follow-up] Answers cached for evaluation');

      const response: OSCEFollowupQuestionsResponse = {
        success: true,
        questions: questionsForFrontend
      };

      return NextResponse.json(response);

    } catch (error) {
      console.error('❌ [OSCE Follow-up] Error:', error);
      return handleApiError(error, 'generateOSCEFollowupQuestions');
    }
  });
}
