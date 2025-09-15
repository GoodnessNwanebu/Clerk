import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';
import type { OSCEEvaluation } from '../../../../types/osce';

interface EvaluateOSCEPerformanceRequest {
  sessionId: string;
  originalCase: {
    department: string;
    patientProfile: any;
    targetDiagnosis: string;
    keyHistoryPoints: string[];
  };
  historyQuestions: string[];
  followUpAnswers: {
    questionId: string;
    question: string;
    answer: string;
    category: string;
  }[];
  studentDiagnosis: string;
}

interface OSCEScoreBreakdown {
  historyStructure: number; // 0-25 points
  questionRelevance: number; // 0-25 points
  coverage: number; // 0-25 points
  diagnosticAccuracy: number; // 0-25 points
  total: number; // 0-100 points
}

interface OSCEFeedback {
  overallScore: number;
  scoreBreakdown: OSCEScoreBreakdown;
  strengths: string[];
  areasForImprovement: string[];
  specificFeedback: {
    historyTaking: string;
    followUpQuestions: string;
    diagnosticReasoning: string;
  };
  recommendations: string[];
}

interface EvaluateOSCEPerformanceResponse {
  success: boolean;
  feedback: OSCEEvaluation;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { sessionId }: { sessionId: string } = await request.json();
    
    console.log('📊 OSCE Performance evaluation request for session:', sessionId);

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    // Retrieve cached follow-up questions and other session data
    const { getOSCEFollowUpQuestions, getOSCESessionData } = await import('../../../../lib/cache/osce-cache');
    const cachedQuestions = await getOSCEFollowUpQuestions(sessionId);
    const sessionData = await getOSCESessionData(sessionId);
    
    if (!cachedQuestions || cachedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Follow-up questions not found for this session' },
        { status: 404 }
      );
    }

    // Generate evaluation prompt using cached data
    const prompt = `
You are an expert medical educator evaluating an OSCE (Objective Structured Clinical Examination) performance.

**Case Details:**
- Session ID: ${sessionId}
- Follow-up Questions Count: ${cachedQuestions.length}

**Student's Follow-up Question Answers:**
${cachedQuestions.map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.studentAnswer || 'No answer provided'}\n   Category: ${q.category}`).join('\n\n')}

**Evaluation Criteria (Total: 100 points):**

1. **History Structure (25 points):**
   - Systematic approach to history taking
   - Logical flow of questions
   - Appropriate use of open/closed questions
   - Good communication skills

2. **Question Relevance (25 points):**
   - Questions directly related to presenting complaint
   - Appropriate depth for the condition
   - Good use of screening questions
   - Relevant follow-up questions

3. **Coverage (25 points):**
   - Covered all essential history points
   - Addressed key differential diagnoses
   - Appropriate depth of questioning
   - Complete history taking

4. **Diagnostic Accuracy (25 points):**
   - Correct identification of key symptoms
   - Appropriate differential diagnosis
   - Good clinical reasoning
   - Correct final diagnosis (if provided)

**Response Format:**
Return a JSON object with this exact structure:

{
  "overallScore": 85,
  "scoreBreakdown": {
    "historyStructure": 20,
    "questionRelevance": 22,
    "coverage": 23,
    "diagnosticAccuracy": 20,
    "total": 85
  },
  "strengths": [
    "Good systematic approach to history taking",
    "Asked relevant screening questions"
  ],
  "areasForImprovement": [
    "Could have explored family history more thoroughly",
    "Missed some key red flag symptoms"
  ],
  "specificFeedback": {
    "historyTaking": "Your history taking showed good structure and flow...",
    "followUpQuestions": "Your answers to follow-up questions demonstrated...",
    "diagnosticReasoning": "Your diagnostic approach was..."
  },
  "recommendations": [
    "Practice more systematic history taking frameworks",
    "Focus on red flag symptoms for this condition"
  ]
}

Evaluate the performance now:`;

    // Call AI service
    const response = await ai.generateContent({
      model: MODEL,
      contents: [{ text: prompt }],
    });

    const responseText = response.text;
    console.log('🤖 AI Response for OSCE evaluation:', responseText.substring(0, 200) + '...');

    // Parse the JSON response
    const feedback = parseJsonResponse<OSCEFeedback>(responseText, 'OSCE Evaluation');
    
    // Generate followUpCorrections using pre-generated correct answers from cached questions
    let followUpCorrections: Array<{
      questionId: string;
      question: string;
      studentAnswer: string;
      correctAnswer: string;
      explanation: string;
    }> = [];
    
    if (cachedQuestions && cachedQuestions.length > 0) {
      followUpCorrections = cachedQuestions.map((question) => {
        return {
          questionId: question.id,
          question: question.question,
          studentAnswer: question.studentAnswer || 'No answer provided',
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        };
      });
    }
    
    // Create OSCEEvaluation structure
    const evaluation: OSCEEvaluation = {
      sessionId: sessionId,
      scores: {
        historyTakingStructure: feedback.scoreBreakdown.historyStructure,
        questionRelevance: feedback.scoreBreakdown.questionRelevance,
        historyCoverage: feedback.scoreBreakdown.coverage,
        diagnosticAccuracy: feedback.scoreBreakdown.diagnosticAccuracy,
        followUpQuestions: 0, // Will be calculated based on follow-up answers
        overallScore: feedback.overallScore
      },
      feedback: {
        strengths: feedback.strengths,
        weaknesses: feedback.areasForImprovement, // Map areasForImprovement to weaknesses
        recommendations: feedback.recommendations,
        followUpCorrections: followUpCorrections
      },
      completedAt: new Date().toISOString()
    };
    
    // Validate feedback structure
    if (!feedback.overallScore || !feedback.scoreBreakdown || !feedback.strengths || !feedback.areasForImprovement) {
      throw new Error('Invalid feedback structure: missing required fields');
    }

    // Validate score breakdown
    const { historyStructure, questionRelevance, coverage, diagnosticAccuracy, total } = feedback.scoreBreakdown;
    if (typeof historyStructure !== 'number' || typeof questionRelevance !== 'number' || 
        typeof coverage !== 'number' || typeof diagnosticAccuracy !== 'number' || typeof total !== 'number') {
      throw new Error('Invalid score breakdown: all scores must be numbers');
    }

    // Validate score ranges (0-25 for individual, 0-100 for total)
    if (historyStructure < 0 || historyStructure > 25 || 
        questionRelevance < 0 || questionRelevance > 25 ||
        coverage < 0 || coverage > 25 ||
        diagnosticAccuracy < 0 || diagnosticAccuracy > 25 ||
        total < 0 || total > 100) {
      throw new Error('Invalid score ranges: individual scores should be 0-25, total should be 0-100');
    }

    console.log('✅ Successfully evaluated OSCE performance:', {
      overallScore: evaluation.scores.overallScore,
      breakdown: evaluation.scores,
      followUpCorrectionsCount: evaluation.feedback.followUpCorrections.length
    });

    return NextResponse.json({
      success: true,
      feedback: evaluation
    } as EvaluateOSCEPerformanceResponse);

  } catch (error) {
    console.error('❌ Error evaluating OSCE performance:', error);
    return handleApiError(error, 'Failed to evaluate OSCE performance');
  }
}