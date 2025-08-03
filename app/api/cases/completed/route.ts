import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json({ 
        error: 'userEmail is required' 
      }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Fetch completed cases
    const completedCases = await prisma.case.findMany({
      where: {
        userId: user.id,
        isCompleted: true
      },
      include: {
        department: true,
        patientProfile: true,
        pediatricProfile: true,
        messages: {
          orderBy: { timestamp: 'asc' }
        },
        feedback: true,
        examinationResults: true,
        investigationResults: true
      },
      orderBy: {
        savedAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      cases: completedCases 
    });

  } catch (error) {
    console.error('Error fetching completed cases:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 