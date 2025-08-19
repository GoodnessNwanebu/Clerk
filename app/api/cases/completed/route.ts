import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch completed cases for the user
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
        }
      },
      orderBy: {
        savedAt: 'desc'
      }
    });

    // Transform the data to match the frontend interface
    const transformedCases = completedCases.map(caseRecord => ({
      id: caseRecord.id,
      diagnosis: caseRecord.diagnosis,
      department: {
        name: caseRecord.department.name
      },
      savedAt: caseRecord.savedAt?.toISOString() || caseRecord.completedAt?.toISOString() || caseRecord.updatedAt.toISOString(),
      completedAt: caseRecord.completedAt?.toISOString() || caseRecord.updatedAt.toISOString()
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
