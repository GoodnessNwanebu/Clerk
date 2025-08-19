import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';
import { prisma } from '../../../../lib/database/prisma';
import { generateCaseReport } from '../../../../lib/ai/ai-utils';
import type { 
  CompleteCaseRequest, 
  CompleteCaseResponse, 
  CaseReport,
  Feedback,
  ComprehensiveFeedback 
} from '../../../../types';

// Case completion endpoint with session validation
export async function POST(request: NextRequest) {
  return requireActiveSession(request, async (sessionContext: SessionMiddlewareContext) => {
    try {
      const body: CompleteCaseRequest = sessionContext.requestBody || {};
      const { 
        finalDiagnosis, 
        managementPlan, 
        examinationResults, 
        investigationResults,
        messages,
        makeVisible = false 
      } = body;

      const { caseSession, primaryContext } = sessionContext;
      const caseId = caseSession.caseId;

      // Validate required fields
      if (!finalDiagnosis || !managementPlan) {
        return NextResponse.json(
          { error: 'Final diagnosis and management plan are required' },
          { status: 400 }
        );
      }

      // Generate comprehensive feedback using secure primary context
      const feedback = await generateComprehensiveFeedback({
        primaryContext,
        secondaryContext: {
          messages,
          finalDiagnosis,
          managementPlan,
          examinationResults,
          investigationResults
        }
      });

      // Generate standard medical case report (rounds format)
      const caseReport = await generateCaseReport({
        primaryContext,
        secondaryContext: {
          messages,
          finalDiagnosis,
          managementPlan,
          examinationResults,
          investigationResults
        }
      });

      // First, update the case session to inactive
      await prisma.caseSession.updateMany({
        where: { caseId },
        data: { isActive: false }
      });

      // Save completed case to database
      const completedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          finalDiagnosis,
          managementPlan,
          isVisible: makeVisible, // User's visibility preference
          completedAt: new Date(),
          isCompleted: true,
          sessionId: null // Clear session after completion
        }
      });

      // Clear session since case is completed
      const response = NextResponse.json({
        success: true,
        caseId,
        message: 'Case completed successfully',
        feedback,
        caseReport
      });

      return response;

    } catch (error) {
      console.error('Error completing case:', error);
      return NextResponse.json(
        { error: 'Failed to complete case' },
        { status: 500 }
      );
    }
  });
}

// Helper function to generate comprehensive feedback
async function generateComprehensiveFeedback(context: {
  primaryContext: any;
  secondaryContext: any;
}): Promise<ComprehensiveFeedback> {
  try {
    // Call the comprehensive feedback AI endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/comprehensive-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caseState: {
          department: context.primaryContext.department,
          caseDetails: context.primaryContext,
          messages: context.secondaryContext.messages,
          finalDiagnosis: context.secondaryContext.finalDiagnosis,
          managementPlan: context.secondaryContext.managementPlan,
          examinationResults: context.secondaryContext.examinationResults,
          investigationResults: context.secondaryContext.investigationResults
        }
      })
    });

    if (!response.ok) {
      throw new Error(`AI feedback generation failed: ${response.statusText}`);
    }

    const feedback = await response.json();
    return feedback;
  } catch (error) {
    console.error('Error generating comprehensive feedback:', error);
    // Return fallback feedback structure
    return {
      diagnosis: context.primaryContext.diagnosis,
      keyLearningPoint: 'Key learning point from the case',
      whatYouDidWell: ['Good history taking', 'Appropriate examination', 'Logical reasoning'],
      clinicalReasoning: 'Analysis of clinical reasoning',
      clinicalOpportunities: {
        areasForImprovement: ['Could have asked more specific questions', 'Considered differential diagnosis'],
        missedOpportunities: [
          {
            opportunity: 'Early ECG interpretation',
            clinicalSignificance: 'Could have led to earlier diagnosis'
          }
        ]
      },
      clinicalPearls: ['Always consider the worst-case scenario', 'Time is muscle in cardiac cases']
    };
  }
}
