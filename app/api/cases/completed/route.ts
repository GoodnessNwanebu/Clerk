import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    // For now, fetch all completed cases if no userEmail is provided
    // In the future, we can implement proper user authentication
    let whereClause: any = { isCompleted: true };
    
    if (userEmail) {
      // Get user
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (user) {
        whereClause.userId = user.id;
      }
    }

    // Fetch completed cases
    const completedCases = await prisma.case.findMany({
      where: whereClause,
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