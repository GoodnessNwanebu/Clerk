import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { 
  cacheOSCEEvaluation, 
  getOSCEEvaluation 
} from '../../../../lib/cache/osce-cache';
import type { OSCEEvaluation } from '../../../../types/osce';

interface SaveEvaluationRequest {
  sessionId: string;
  evaluation: OSCEEvaluation;
}

interface SaveEvaluationResponse {
  success: boolean;
  error?: string;
}

interface GetEvaluationResponse {
  success: boolean;
  evaluation?: OSCEEvaluation;
  error?: string;
}

/**
 * POST /api/osce/evaluation - Save evaluation for an OSCE session
 */
export async function POST(request: NextRequest): Promise<NextResponse<SaveEvaluationResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: SaveEvaluationRequest = await request.json();
    
    // Validate required fields
    if (!body.sessionId || !body.evaluation) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, evaluation' },
        { status: 400 }
      );
    }

    // Validate evaluation structure
    if (!body.evaluation.sessionId || !body.evaluation.scores || !body.evaluation.feedback) {
      return NextResponse.json(
        { success: false, error: 'Invalid evaluation structure' },
        { status: 400 }
      );
    }

    // Ensure sessionId matches
    if (body.evaluation.sessionId !== body.sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID mismatch' },
        { status: 400 }
      );
    }

    // Cache the evaluation
    await cacheOSCEEvaluation(body.sessionId, body.evaluation);

    console.log('✅ Saved OSCE evaluation:', {
      sessionId: body.sessionId,
      overallScore: body.evaluation.scores.overallScore
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Error saving OSCE evaluation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save OSCE evaluation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/osce/evaluation - Get evaluation for an OSCE session
 */
export async function GET(request: NextRequest): Promise<NextResponse<GetEvaluationResponse>> {
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

    // Get evaluation from cache
    const evaluation = await getOSCEEvaluation(sessionId);

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: 'Evaluation not found for this session' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      evaluation
    });

  } catch (error) {
    console.error('❌ Error retrieving OSCE evaluation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve OSCE evaluation' },
      { status: 500 }
    );
  }
}
