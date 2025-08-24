import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';
import type { UpdateCaseVisibilityRequest, UpdateCaseVisibilityResponse } from '../../../../types';

// Update case visibility for authenticated user
    export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UpdateCaseVisibilityRequest = await request.json();
    const { caseId, isVisible } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: 'Case ID is required' },
        { status: 400 }
      );
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify case belongs to user and is completed
    const case_ = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId: user.id,
        isCompleted: true
      }
    });

    if (!case_) {
      return NextResponse.json(
        { error: 'Case not found or not completed' },
        { status: 404 }
      );
    }

    // Update case visibility
    await prisma.case.update({
      where: { id: caseId },
      data: { isVisible }
    });

    return NextResponse.json({
      success: true,
      message: `Case ${isVisible ? 'made visible' : 'hidden'} successfully`
    });

  } catch (error) {
    console.error('Error updating case visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update case visibility' },
      { status: 500 }
    );
  }
}
