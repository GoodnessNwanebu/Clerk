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
import { prisma } from '../../../../lib/prisma'
import { Message } from '../../../../types'
import { 
  generateClinicalSummary,
  generateKeyFindings,
  generateInvestigations,
  generateManagementPlan,
  generateClinicalOpportunities,
  generateClinicalPearls,
  createFallbackSummary
} from '../../../../lib/ai-utils'

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

      case 'saveCompletedCase':
        // Save completed case from feedback page
        if (body.completedCase) {
          const { completedCase } = body;
          
          // Get or create department
          let department = await prisma.department.findFirst({
            where: { name: completedCase.department || 'Unknown' }
          });
          
          if (!department) {
            department = await prisma.department.create({
              data: { name: completedCase.department || 'Unknown' }
            });
          }

          // Create a new case record for the completed case
          const newCase = await prisma.case.create({
            data: {
              userId: user.id,
              departmentId: department.id,
              diagnosis: completedCase.condition,
              primaryInfo: completedCase.patientInfo.primaryInfo,
              openingLine: completedCase.patientInfo.openingLine,
              isPediatric: completedCase.patientInfo.isPediatric,
              completedAt: new Date(completedCase.completedAt),
              savedAt: new Date(), // When user clicked "Save This Case"
              isCompleted: true, // Mark as completed case
              // Add patient profile if exists
              ...(completedCase.patientInfo.patientProfile && {
                patientProfile: {
                  create: {
                    educationLevel: completedCase.patientInfo.patientProfile.educationLevel,
                    healthLiteracy: completedCase.patientInfo.patientProfile.healthLiteracy,
                    occupation: completedCase.patientInfo.patientProfile.occupation,
                    recordKeeping: completedCase.patientInfo.patientProfile.recordKeeping
                  }
                }
              }),
              // Add pediatric profile if exists
              ...(completedCase.patientInfo.pediatricProfile && completedCase.patientInfo.patientProfile && {
                pediatricProfile: {
                  create: {
                    patientAge: completedCase.patientInfo.pediatricProfile.patientAge,
                    ageGroup: completedCase.patientInfo.pediatricProfile.ageGroup,
                    respondingParent: completedCase.patientInfo.pediatricProfile.respondingParent,
                    developmentalStage: completedCase.patientInfo.pediatricProfile.developmentalStage,
                    communicationLevel: completedCase.patientInfo.pediatricProfile.communicationLevel
                  }
                }
              })
            }
          });

          // Save conversation messages
          if (completedCase.messages && Array.isArray(completedCase.messages)) {
            for (const message of completedCase.messages) {
              await addMessage({
                sender: message.sender,
                text: message.text,
                speakerLabel: message.speakerLabel,
                caseId: newCase.id
              });
            }
          }

          // Save case state
          await updateCaseState(newCase.id, {
            preliminaryDiagnosis: completedCase.preliminaryDiagnosis,
            examinationPlan: completedCase.examinationPlan,
            investigationPlan: completedCase.investigationPlan,
            finalDiagnosis: completedCase.finalDiagnosis,
            managementPlan: completedCase.managementPlan,
            completedAt: new Date(completedCase.completedAt)
          });

          // Save examination results
          if (completedCase.examinationResults && Array.isArray(completedCase.examinationResults)) {
            await saveExaminationResults(newCase.id, completedCase.examinationResults);
          }

          // Save investigation results
          if (completedCase.investigationResults && Array.isArray(completedCase.investigationResults)) {
            await saveInvestigationResults(newCase.id, completedCase.investigationResults);
          }

          // Save feedback
          if (completedCase.feedback) {
            await saveFeedback(newCase.id, completedCase.feedback);
          }

          // Generate enhanced saved case content with AI (Phase 1)
          try {
            console.log('Generating enhanced saved case content...');
            
            // Get the saved data for AI generation
            const savedCase = await prisma.case.findUnique({
              where: { id: newCase.id },
              include: {
                examinationResults: true,
                investigationResults: true,
                feedback: true,
                patientProfile: true,
                pediatricProfile: true
              }
            });

            if (savedCase) {
              // Generate AI content with fallback
              const [clinicalSummary, keyFindings, investigations, managementPlan, clinicalOpportunities, clinicalPearls] = await Promise.allSettled([
                generateClinicalSummary(
                  completedCase.patientInfo,
                  savedCase.examinationResults,
                  savedCase.investigationResults
                ),
                generateKeyFindings(
                  savedCase.examinationResults,
                  savedCase.investigationResults
                ),
                generateInvestigations(
                  completedCase.condition,
                  completedCase.patientInfo
                ),
                generateManagementPlan(
                  completedCase.condition,
                  completedCase.patientInfo
                ),
                generateClinicalOpportunities(
                  completedCase.feedback,
                  completedCase.condition
                ),
                generateClinicalPearls(
                  completedCase.feedback,
                  completedCase.condition
                )
              ]);

              // Use AI results or fallback
              const fallback = createFallbackSummary(completedCase.patientInfo, savedCase.examinationResults, savedCase.investigationResults);
              
              const finalClinicalSummary = clinicalSummary.status === 'fulfilled' && clinicalSummary.value 
                ? clinicalSummary.value 
                : fallback.clinicalSummary;

              const finalKeyFindings = keyFindings.status === 'fulfilled' && keyFindings.value 
                ? keyFindings.value 
                : fallback.keyFindings;

              const finalInvestigations = investigations.status === 'fulfilled' && investigations.value 
                ? investigations.value 
                : fallback.investigations;

              const finalManagementPlan = managementPlan.status === 'fulfilled' && managementPlan.value 
                ? managementPlan.value 
                : fallback.managementPlan;

              const finalClinicalOpportunities = clinicalOpportunities.status === 'fulfilled' && clinicalOpportunities.value 
                ? clinicalOpportunities.value 
                : fallback.clinicalOpportunities;

              const finalClinicalPearls = clinicalPearls.status === 'fulfilled' && clinicalPearls.value 
                ? clinicalPearls.value 
                : null;

              // Update case with enhanced content
              await prisma.case.update({
                where: { id: newCase.id },
                data: {
                  clinicalSummary: finalClinicalSummary,
                  keyFindings: finalKeyFindings,
                  investigations: finalInvestigations,
                  enhancedManagementPlan: finalManagementPlan,
                  clinicalOpportunities: finalClinicalOpportunities,
                  clinicalPearls: finalClinicalPearls,
                  aiGeneratedAt: new Date()
                }
              });

              console.log('Enhanced saved case content generated successfully');
            }
          } catch (aiError) {
            console.error('Error generating AI content, using fallback:', aiError);
            
            // Use fallback content
            const fallback = createFallbackSummary(
              completedCase.patientInfo,
              completedCase.examinationResults || [],
              completedCase.investigationResults || []
            );

            await prisma.case.update({
              where: { id: newCase.id },
              data: {
                clinicalSummary: fallback.clinicalSummary,
                keyFindings: fallback.keyFindings,
                investigations: fallback.investigations,
                aiGeneratedAt: new Date()
              }
            });
          }

          return NextResponse.json({ 
            success: true, 
            caseId: newCase.id 
          });
        } else {
          return NextResponse.json({ 
            error: 'No completed case data provided' 
          }, { status: 400 });
        }
        break;

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