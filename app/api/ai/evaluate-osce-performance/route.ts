import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';

interface EvaluateOSCEPerformanceRequest {
  originalCase: {
    department: string;
    patientProfile: any;
    targetDiagnosis: string;
    keyHistoryPoints: string[];
  };
  historyQuestions: string[];
  followUpAnswers: {
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
  feedback: OSCEFeedback;
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

    const { originalCase, historyQuestions, followUpAnswers, studentDiagnosis }: EvaluateOSCEPerformanceRequest = await request.json();
    
    console.log('📊 OSCE Performance evaluation request:', { 
      department: originalCase.department,
      historyQuestionsCount: historyQuestions.length,
      followUpAnswersCount: followUpAnswers.length
    });

    // Validate required fields
    if (!originalCase || !historyQuestions || !followUpAnswers || !studentDiagnosis) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: originalCase, historyQuestions, followUpAnswers, studentDiagnosis' },
        { status: 400 }
      );
    }

    // Generate evaluation prompt
    const prompt = `
You are an expert medical educator evaluating an OSCE (Objective Structured Clinical Examination) performance.

**Case Details:**
- Department: ${originalCase.department}
- Target Diagnosis: ${originalCase.targetDiagnosis}
- Key History Points: ${originalCase.keyHistoryPoints.join(', ')}

**Student's Performance:**

**History Taking Questions Asked:**
${historyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

**Follow-up Question Answers:**
${followUpAnswers.map((qa, i) => `${i + 1}. Q: ${qa.question}\n   A: ${qa.answer}\n   Category: ${qa.category}`).join('\n\n')}

**Student's Diagnosis:** ${studentDiagnosis}

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
      overallScore: feedback.overallScore,
      breakdown: feedback.scoreBreakdown
    });

    return NextResponse.json({
      success: true,
      feedback: feedback
    } as EvaluateOSCEPerformanceResponse);

  } catch (error) {
    console.error('❌ Error evaluating OSCE performance:', error);
    return handleApiError(error, 'Failed to evaluate OSCE performance');
  }
}