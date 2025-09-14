import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { 
  cacheOSCESession, 
  getOSCESession, 
  cleanupOSCESession,
  isOSCESessionCached 
} from '../../../../lib/cache/osce-cache';
import type { OSCESession } from '../../../../types/osce';

interface CreateOSCESessionRequest {
  mode: 'simulation' | 'practice';
  department: string;
  caseType?: 'single-diagnosis' | 'custom';
  customCondition?: string;
  caseId: string;
}

interface CreateOSCESessionResponse {
  success: boolean;
  session?: OSCESession;
  error?: string;
}

interface GetOSCESessionResponse {
  success: boolean;
  session?: OSCESession;
  error?: string;
}

interface DeleteOSCESessionResponse {
  success: boolean;
  error?: string;
}

/**
 * POST /api/osce/session - Create a new OSCE session
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateOSCESessionResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: CreateOSCESessionRequest = await request.json();
    
    // Validate required fields
    if (!body.mode || !body.department || !body.caseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: mode, department, caseId' },
        { status: 400 }
      );
    }

    // Validate practice mode requirements
    if (body.mode === 'practice' && !body.caseType) {
      return NextResponse.json(
        { success: false, error: 'caseType is required for practice mode' },
        { status: 400 }
      );
    }

    if (body.caseType === 'custom' && !body.customCondition) {
      return NextResponse.json(
        { success: false, error: 'customCondition is required for custom case type' },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `osce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create OSCE session
    const osceSession: OSCESession = {
      mode: body.mode,
      department: body.department as any, // Type assertion for now
      caseType: body.caseType,
      customCondition: body.customCondition,
      caseId: body.caseId,
      sessionId,
      startTime: new Date().toISOString(),
      duration: 5 // 5 minutes for history taking
    };

    // Cache the session
    await cacheOSCESession(osceSession);

    console.log('✅ Created OSCE session:', {
      sessionId,
      mode: body.mode,
      department: body.department,
      caseId: body.caseId
    });

    return NextResponse.json({
      success: true,
      session: osceSession
    });

  } catch (error) {
    console.error('❌ Error creating OSCE session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create OSCE session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/osce/session - Get OSCE session by sessionId
 */
export async function GET(request: NextRequest): Promise<NextResponse<GetOSCESessionResponse>> {
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

    // Get session from cache
    const osceSession = await getOSCESession(sessionId);

    if (!osceSession) {
      return NextResponse.json(
        { success: false, error: 'OSCE session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: osceSession
    });

  } catch (error) {
    console.error('❌ Error retrieving OSCE session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve OSCE session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/osce/session - Clean up OSCE session
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteOSCESessionResponse>> {
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

    // Clean up session cache
    await cleanupOSCESession(sessionId);

    console.log('✅ Cleaned up OSCE session:', sessionId);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Error cleaning up OSCE session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean up OSCE session' },
      { status: 500 }
    );
  }
}
