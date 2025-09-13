import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSession } from '../../../../lib/middleware/session-middleware';
import type { SessionMiddlewareContext } from '../../../../lib/middleware/session-middleware';
import { prisma } from '../../../../lib/database/prisma';
import { generateCaseReport } from '../../../../lib/ai/ai-utils';
import { invalidatePrimaryContext } from '../../../../lib/cache/primary-context-cache';
import { comprehensiveFeedbackPrompt, getSurgicalContext } from '../../../../lib/ai/prompts/feedback';
import { ai, MODEL, parseJsonResponse } from '../../../../lib/ai/ai-utils';
import { retrySilently } from '../../../../lib/util';
import { 
  saveMessagesFromLocalStorage,
  saveExaminationResultsFromLocalStorage,
  saveInvestigationResultsFromLocalStorage,
  saveComprehensiveFeedback,
  saveCaseReport
} from '../../../../lib/database/database';
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
        preliminaryDiagnosis,
        examinationPlan,
        investigationPlan,
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

      console.log('🔄 [complete] Starting sequential feedback and case report generation...');
      
      // Generate comprehensive feedback first for immediate display
      console.log('🔄 [complete] Generating feedback first...');
      const feedback = await generateComprehensiveFeedbackDirect({
        primaryContext,
        secondaryContext: {
          messages,
          finalDiagnosis,
          managementPlan,
          examinationResults,
          investigationResults
        }
      });
      
      console.log('✅ [complete] Feedback generated successfully, starting case report in background...');
      
      // Generate case report in the background with retry logic (don't await)
      const caseReportPromise = retrySilently(async () => {
        console.log('🔄 [complete] Generating case report with retry logic...');
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
        
        console.log('✅ [complete] Case report generated, saving to database...');
        await saveCaseReport(caseId, caseReport);
        console.log('✅ [complete] Case report saved to database');
        return caseReport;
      }, 3, 2000, 1.5); // 3 attempts, 2s initial delay, 1.5x backoff
      
      // Don't await the case report - let it run in background
      // The response will be sent immediately with just the feedback

      // Save completed case to database with comprehensive logging
      console.log('🔄 [complete] Saving case to database...');
      console.log('📊 [complete] Case data:', {
        caseId,
        finalDiagnosis: finalDiagnosis?.substring(0, 100) + '...',
        managementPlan: managementPlan?.substring(0, 100) + '...',
        makeVisible,
        examinationResultsCount: examinationResults?.length || 0,
        investigationResultsCount: investigationResults?.length || 0,
        messagesCount: messages?.length || 0
      });
      
      const completedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          finalDiagnosis,
          managementPlan,
          preliminaryDiagnosis,
          examinationPlan,
          investigationPlan,
          isVisible: makeVisible, // User's visibility preference
          completedAt: new Date(),
          isCompleted: true
          // Don't clear sessionId yet - keep it for feedback generation
        }
      });
      console.log('✅ [complete] Case saved to database successfully');

      // Save all data from localStorage to database
      console.log('🔄 [complete] Saving all data from localStorage to database...');

      // Save messages
      if (messages && messages.length > 0) {
        console.log(`📝 [complete] Saving ${messages.length} messages...`);
        await saveMessagesFromLocalStorage(caseId, messages);
        console.log('✅ [complete] Messages saved to database');
      }

      // Save examination results
      if (examinationResults && examinationResults.length > 0) {
        console.log(`🔍 [complete] Saving ${examinationResults.length} examination results...`);
        await saveExaminationResultsFromLocalStorage(caseId, examinationResults);
        console.log('✅ [complete] Examination results saved to database');
      }

      // Save investigation results
      if (investigationResults && investigationResults.length > 0) {
        console.log(`🔬 [complete] Saving ${investigationResults.length} investigation results...`);
        await saveInvestigationResultsFromLocalStorage(caseId, investigationResults);
        console.log('✅ [complete] Investigation results saved to database');
      }

      // Save feedback
      console.log('📊 [complete] Saving comprehensive feedback...');
      await saveComprehensiveFeedback(caseId, feedback);
      console.log('✅ [complete] Feedback saved to database');

      // Invalidate primary context cache to ensure fresh data for feedback generation
      console.log('🔄 [complete] Invalidating primary context cache...');
      await invalidatePrimaryContext(caseId);
      console.log('✅ [complete] Primary context cache invalidated');

      // Don't deactivate session immediately - let feedback generation complete first
      // The session will be deactivated when the user navigates away or after a delay

      const response = NextResponse.json({
        success: true,
        caseId,
        message: 'Case completed successfully',
        feedback
        // Case report is being generated in the background
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

// Helper function to generate comprehensive feedback directly
async function generateComprehensiveFeedbackDirect(context: {
  primaryContext: any;
  secondaryContext: any;
}): Promise<ComprehensiveFeedback> {
  try {
    console.log('🔄 [generateComprehensiveFeedbackDirect] Starting AI feedback generation...');
    
    // Create caseState for the AI prompt
    const caseState = {
      department: context.primaryContext.department,
      caseId: context.primaryContext.caseId,
      sessionId: context.primaryContext.sessionId,
      caseDetails: context.primaryContext,
      messages: context.secondaryContext.messages,
      finalDiagnosis: context.secondaryContext.finalDiagnosis,
      managementPlan: context.secondaryContext.managementPlan,
      examinationResults: context.secondaryContext.examinationResults,
      investigationResults: context.secondaryContext.investigationResults,
      preliminaryDiagnosis: context.secondaryContext.preliminaryDiagnosis,
      examinationPlan: context.secondaryContext.examinationPlan,
      investigationPlan: context.secondaryContext.investigationPlan,
      feedback: null
    };
    
    // Get surgical context for the prompt
    const surgicalContext = getSurgicalContext(caseState);
    
    // Generate the comprehensive feedback prompt
    const prompt = comprehensiveFeedbackPrompt(caseState, surgicalContext);
    
    console.log('🔄 [generateComprehensiveFeedbackDirect] Calling AI service...');
    
    // Call the AI service directly
    const response = await ai.generateContent({
      model: MODEL,
      contents: [{ text: prompt }],
    });
    
    if (!response.text) {
      throw new Error('AI response was empty');
    }
    
    console.log('✅ [generateComprehensiveFeedbackDirect] AI feedback generated successfully');
    
    // Parse the JSON response from the AI
    const feedback = parseJsonResponse<ComprehensiveFeedback>(response.text, 'generateComprehensiveFeedbackDirect');
    
    return feedback;
    
  } catch (error) {
    console.error('Error generating comprehensive feedback:', error);
    // Return fallback feedback structure
    return {
      diagnosis: context.primaryContext.diagnosis || 'Unknown',
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
