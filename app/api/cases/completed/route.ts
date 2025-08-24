import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';
import { ensureUserExists } from '../../../../lib/database/database';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(auth) as { user?: { email?: string; name?: string; image?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create user from database
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('🔄 Creating new user for email:', session.user.email);
      try {
        user = await ensureUserExists(
          session.user.email,
          session.user.name || undefined,
          session.user.image || undefined
        );
        console.log('✅ User created successfully:', user.id);
      } catch (error) {
        console.error('❌ Error creating user:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500 }
        );
      }
    }

    // Fetch completed cases for the user with all related data
    const completedCases = await prisma.case.findMany({
      where: {
        userId: user.id,
        isCompleted: true,
        isVisible: true
      },
      include: {
        department: {
          select: {
            name: true
          }
        },
        messages: {
          orderBy: { timestamp: 'asc' }
        },
        examinationResults: true,
        investigationResults: true,
        feedback: true,
        caseReport: true
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Transform the data to match the frontend interface
    const transformedCases = completedCases.map(caseRecord => ({
      id: caseRecord.id,
      diagnosis: caseRecord.diagnosis,
      department: {
        name: caseRecord.department.name
      },
      // savedAt: caseRecord.savedAt?.toISOString() || caseRecord.completedAt?.toISOString() || caseRecord.updatedAt.toISOString(),
      completedAt: caseRecord.completedAt?.toISOString() || caseRecord.updatedAt.toISOString(),
      // Include all the saved data
      messages: caseRecord.messages,
      examinationResults: caseRecord.examinationResults,
      investigationResults: caseRecord.investigationResults,
      feedback: caseRecord.feedback,
      caseReport: caseRecord.caseReport
    }));

    return NextResponse.json({
      success: true,
      cases: transformedCases
    });

  } catch (error) {
    console.error('Error fetching completed cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch completed cases' },
      { status: 500 }
    );
  }
}
