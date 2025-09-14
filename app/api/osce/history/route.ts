import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { 
  cacheOSCEHistoryQuestions, 
  getOSCEHistoryQuestions 
} from '../../../../lib/cache/osce-cache';

interface SaveHistoryQuestionsRequest {
  sessionId: string;
  questions: string[];
}

interface SaveHistoryQuestionsResponse {
  success: boolean;
  error?: string;
}

interface GetHistoryQuestionsResponse {
  success: boolean;
  questions?: string[];
  error?: string;
}

/**
 * POST /api/osce/history - Save history questions for an OSCE session
 */
export async function POST(request: NextRequest): Promise<NextResponse<SaveHistoryQuestionsResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: SaveHistoryQuestionsRequest = await request.json();
    
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

    // Cache the history questions
    await cacheOSCEHistoryQuestions(body.sessionId, body.questions);

    console.log('✅ Saved OSCE history questions:', {
      sessionId: body.sessionId,
      questionCount: body.questions.length
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Error saving OSCE history questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save OSCE history questions' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/osce/history - Get history questions for an OSCE session
 */
export async function GET(request: NextRequest): Promise<NextResponse<GetHistoryQuestionsResponse>> {
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

    // Get history questions from cache
    const questions = await getOSCEHistoryQuestions(sessionId);

    if (!questions) {
      return NextResponse.json(
        { success: false, error: 'History questions not found for this session' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('❌ Error retrieving OSCE history questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve OSCE history questions' },
      { status: 500 }
    );
  }
}
