import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { 
  cacheOSCEFollowUpQuestions, 
  getOSCEFollowUpQuestions,
  updateOSCEFollowUpAnswer 
} from '../../../../lib/cache/osce-cache';
import type { OSCEFollowUpQuestion } from '../../../../types/osce';

interface SaveFollowUpQuestionsRequest {
  sessionId: string;
  questions: OSCEFollowUpQuestion[];
}

interface SaveFollowUpQuestionsResponse {
  success: boolean;
  error?: string;
}

interface GetFollowUpQuestionsResponse {
  success: boolean;
  questions?: OSCEFollowUpQuestion[];
  error?: string;
}

interface UpdateAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
}

interface UpdateAnswerResponse {
  success: boolean;
  error?: string;
}

/**
 * POST /api/osce/followup - Save follow-up questions for an OSCE session
 */
export async function POST(request: NextRequest): Promise<NextResponse<SaveFollowUpQuestionsResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: SaveFollowUpQuestionsRequest = await request.json();
    
    // Validate required fields
    if (!body.sessionId || !body.questions) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, questions' },
        { status: 400 }
      );
    }

    // Validate questions array
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Questions must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate that first question is about diagnosis
    const firstQuestion = body.questions[0];
    if (!firstQuestion.question.toLowerCase().includes('diagnosis')) {
      console.warn('⚠️ First follow-up question should be about diagnosis');
    }

    // Cache the follow-up questions
    await cacheOSCEFollowUpQuestions(body.sessionId, body.questions);

    console.log('✅ Saved OSCE follow-up questions:', {
      sessionId: body.sessionId,
      questionCount: body.questions.length
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Error saving OSCE follow-up questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save OSCE follow-up questions' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/osce/followup - Get follow-up questions for an OSCE session
 */
export async function GET(request: NextRequest): Promise<NextResponse<GetFollowUpQuestionsResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get follow-up questions from cache
    const questions = await getOSCEFollowUpQuestions(sessionId);

    if (!questions) {
      return NextResponse.json(
        { success: false, error: 'Follow-up questions not found for this session' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('❌ Error retrieving OSCE follow-up questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve OSCE follow-up questions' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/osce/followup - Update a follow-up question answer
 */
export async function PUT(request: NextRequest): Promise<NextResponse<UpdateAnswerResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UpdateAnswerRequest = await request.json();
    
    // Validate required fields
    if (!body.sessionId || !body.questionId || !body.answer) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, questionId, answer' },
        { status: 400 }
      );
    }

    // Update the answer
    await updateOSCEFollowUpAnswer(body.sessionId, body.questionId, body.answer);

    console.log('✅ Updated OSCE follow-up answer:', {
      sessionId: body.sessionId,
      questionId: body.questionId
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Error updating OSCE follow-up answer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update follow-up answer' },
      { status: 500 }
    );
  }
}
