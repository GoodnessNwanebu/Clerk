import { NextRequest, NextResponse } from 'next/server'
import { 
  createOrGetUser, 
  addMessage, 
  updateCaseState,
  updatePatientInfo,
  saveExaminationResults,
  saveInvestigationResults,
  saveFeedback,
  saveDetailedFeedback
} from '../../../../lib/database'
import { Message } from '../../../../types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      action, 
      userEmail, 
      userCountry, 
      caseId, 
      messages, 
      caseState,
      examinationResults,
      investigationResults,
      feedback,
      patientInfo
    } = body

    if (!userEmail || !caseId) {
      return NextResponse.json({ 
        error: 'userEmail and caseId are required' 
      }, { status: 400 })
    }

    // Create or get user
    const user = await createOrGetUser(userEmail, userCountry)

    switch (action) {
      case 'saveConversation':
        // Batch save conversation messages
        if (messages && Array.isArray(messages)) {
          const savedMessages = []
          for (const message of messages) {
            const savedMessage = await addMessage({
              sender: message.sender,
              text: message.text,
              speakerLabel: message.speakerLabel,
              caseId: caseId
            })
            savedMessages.push(savedMessage)
          }
          
          return NextResponse.json({ 
            success: true, 
            savedMessages: savedMessages.length 
          })
        }
        break

      case 'saveCaseState':
        // Save case state (preliminary diagnosis, plans, etc.)
        if (caseState) {
          const updatedCase = await updateCaseState(caseId, {
            preliminaryDiagnosis: caseState.preliminaryDiagnosis,
            examinationPlan: caseState.examinationPlan,
            investigationPlan: caseState.investigationPlan,
            finalDiagnosis: caseState.finalDiagnosis,
            managementPlan: caseState.managementPlan,
            completedAt: caseState.completedAt ? new Date(caseState.completedAt) : undefined
          })
          
          return NextResponse.json({ 
            success: true, 
            case: updatedCase 
          })
        }
        break

      case 'saveResults':
        // Save examination and investigation results
        const results = []
        
        if (examinationResults && Array.isArray(examinationResults)) {
          const savedExamResults = await saveExaminationResults(caseId, examinationResults)
          results.push({ type: 'examination', count: savedExamResults.length })
        }
        
        if (investigationResults && Array.isArray(investigationResults)) {
          const savedInvResults = await saveInvestigationResults(caseId, investigationResults)
          results.push({ type: 'investigation', count: savedInvResults.length })
        }
        
        return NextResponse.json({ 
          success: true, 
          results 
        })

      case 'saveFeedback':
        // Save feedback
        if (feedback) {
          const savedFeedback = await saveFeedback(caseId, feedback)
          return NextResponse.json({ 
            success: true, 
            feedback: savedFeedback 
          })
        }
        break

      case 'saveDetailedFeedback':
        // Save detailed feedback with teaching notes
        if (feedback) {
          const savedFeedback = await saveDetailedFeedback(caseId, feedback)
          return NextResponse.json({ 
            success: true, 
            feedback: savedFeedback 
          })
        }
        break

      case 'savePatientInfo':
        // Save patient information
        if (patientInfo) {
          const updatedCase = await updatePatientInfo(caseId, {
            diagnosis: patientInfo.diagnosis,
            primaryInfo: patientInfo.primaryInfo,
            openingLine: patientInfo.openingLine,
            patientProfile: patientInfo.patientProfile,
            pediatricProfile: patientInfo.pediatricProfile,
            isPediatric: patientInfo.isPediatric
          })
          
          return NextResponse.json({ 
            success: true, 
            case: updatedCase 
          })
        }
        break

      case 'saveCompleteCase':
        // Save everything in one batch operation
        const operations = []
        
        // 1. Save conversation
        if (messages && Array.isArray(messages)) {
          for (const message of messages) {
            await addMessage({
              sender: message.sender,
              text: message.text,
              speakerLabel: message.speakerLabel,
              caseId: caseId
            })
          }
          operations.push(`Saved ${messages.length} messages`)
        }
        
        // 2. Save case state
        if (caseState) {
          await updateCaseState(caseId, {
            preliminaryDiagnosis: caseState.preliminaryDiagnosis,
            examinationPlan: caseState.examinationPlan,
            investigationPlan: caseState.investigationPlan,
            finalDiagnosis: caseState.finalDiagnosis,
            managementPlan: caseState.managementPlan,
            completedAt: caseState.completedAt ? new Date(caseState.completedAt) : undefined
          })
          operations.push('Saved case state')
        }
        
        // 3. Save results
        if (examinationResults && Array.isArray(examinationResults)) {
          await saveExaminationResults(caseId, examinationResults)
          operations.push(`Saved ${examinationResults.length} examination results`)
        }
        
        if (investigationResults && Array.isArray(investigationResults)) {
          await saveInvestigationResults(caseId, investigationResults)
          operations.push(`Saved ${investigationResults.length} investigation results`)
        }
        
        // 4. Save feedback
        if (feedback) {
          await saveFeedback(caseId, feedback)
          operations.push('Saved feedback')
        }
        
        return NextResponse.json({ 
          success: true, 
          operations 
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'No data provided for the specified action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error in batch save API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 