import { prisma } from './prisma'
import { 
  Department, 
  Case, 
  Message, 
  ExaminationResult, 
  InvestigationResult, 
  Feedback,
  PatientProfile,
  PediatricProfile,
  User,
  Session
} from '@prisma/client'
import { 
  CaseState, 
  Message as MessageType, 
  ExaminationResult as ExaminationResultType,
  InvestigationResult as InvestigationResultType,
  Feedback as FeedbackType,
  PatientProfile as PatientProfileType,
  PediatricProfile as PediatricProfileType
} from '../../types'

// User Management
export async function createOrGetUser(email: string, country?: string): Promise<User> {
  return await prisma.user.upsert({
    where: { email },
    update: { country },
    create: { email, country }
  })
}

export async function getUserById(id: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      cases: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      cases: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })
}

// Ensure user exists in database (for API routes)
export async function ensureUserExists(email: string, name?: string, image?: string): Promise<User> {
  return await prisma.user.upsert({
    where: { email },
    update: {
      name: name || undefined,
      image: image || undefined,
      emailVerified: new Date(), // Mark as verified since we're ensuring they exist
    },
    create: {
      email,
      name: name || undefined,
      image: image || undefined,
      emailVerified: new Date(),
    },
  })
}

// Session Management
export async function createSession(userId: string): Promise<Session> {
  return await prisma.session.create({
    data: { userId }
  })
}

export async function getSessionById(id: string): Promise<Session | null> {
  return await prisma.session.findUnique({
    where: { id },
    include: { user: true }
  })
}

// Department Management
export async function getAllDepartments(): Promise<Department[]> {
  return await prisma.department.findMany({
    include: { subspecialties: true },
    orderBy: { name: 'asc' }
  })
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  return await prisma.department.findUnique({
    where: { id },
    include: { subspecialties: true }
  })
}



export async function createDepartment(data: {
  name: string
}): Promise<Department> {
  return await prisma.department.create({ data })
}

// Patient Profile Management
export async function createPatientProfile(data: {
  educationLevel: string
  healthLiteracy: string
  occupation: string
  recordKeeping: string
}): Promise<PatientProfile> {
  return await prisma.patientProfile.create({ data })
}

export async function createPediatricProfile(data: {
  patientAge: number
  ageGroup: string
  respondingParent: string
  developmentalStage: string
  communicationLevel: string
  parentProfileId: string
}): Promise<PediatricProfile> {
  return await prisma.pediatricProfile.create({ data })
}

// Case Management
export async function createCase(data: {
  diagnosis: string
  primaryInfo: string
  openingLine: string
  isPediatric: boolean
  difficultyLevel: string
  timeContext?: string
  location?: string
  isSurgical: boolean
  pathophysiologyCategory?: string
  userId: string
  departmentId: string
  patientProfileId?: string
  pediatricProfileId?: string
}): Promise<Case> {
  return await prisma.case.create({ data })
}

export async function getCaseById(id: string): Promise<Case | null> {
  return await prisma.case.findUnique({
    where: { id },
    include: {
      user: true,
      department: true,
      patientProfile: true,
      pediatricProfile: true,
      messages: {
        orderBy: { timestamp: 'asc' }
      },
      examinationResults: true,
      investigationResults: true,
      feedback: true
    }
  })
}

export async function getUserCases(userId: string, limit = 20): Promise<Case[]> {
  return await prisma.case.findMany({
    where: { userId },
    include: {
      department: true,
      feedback: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

export async function updateCaseState(
  caseId: string, 
  updates: Partial<{
    preliminaryDiagnosis: string
    examinationPlan: string
    investigationPlan: string
    finalDiagnosis: string
    managementPlan: string
    completedAt: Date
    sessionId: string | null
  }>
): Promise<Case> {
  return await prisma.case.update({
    where: { id: caseId },
    data: updates
  })
}

export async function updatePatientInfo(
  caseId: string, 
  updates: Partial<{
    diagnosis: string
    primaryInfo: string
    openingLine: string
    patientProfile: PatientProfileType
    pediatricProfile: PediatricProfileType
    isPediatric: boolean
  }>
): Promise<Case> {
  // Extract patient profile data to handle separately
  const { patientProfile, pediatricProfile, ...caseUpdates } = updates;
  
  // Prepare the update data
  const updateData: any = caseUpdates;
  
  // Handle patient profile relationship if provided
  if (patientProfile) {
    // Create new patient profile
    const savedPatientProfile = await prisma.patientProfile.create({
      data: {
        educationLevel: patientProfile.educationLevel,
        healthLiteracy: patientProfile.healthLiteracy,
        occupation: patientProfile.occupation,
        recordKeeping: patientProfile.recordKeeping
      }
    });
    
    updateData.patientProfileId = savedPatientProfile.id;
  }
  
  // Handle pediatric profile relationship if provided
  if (pediatricProfile && patientProfile) {
    // Create new pediatric profile
    const savedPediatricProfile = await prisma.pediatricProfile.create({
      data: {
        patientAge: pediatricProfile.patientAge,
        ageGroup: pediatricProfile.ageGroup,
        respondingParent: pediatricProfile.respondingParent,
        developmentalStage: pediatricProfile.developmentalStage,
        communicationLevel: pediatricProfile.communicationLevel,
        parentProfileId: updateData.patientProfileId
      }
    });
    
    updateData.pediatricProfileId = savedPediatricProfile.id;
  }
  
  return await prisma.case.update({
    where: { id: caseId },
    data: updateData
  });
}

// Message Management
export async function addMessage(data: {
  sender: string
  text: string
  speakerLabel?: string
  caseId: string
}): Promise<Message> {
  return await prisma.message.create({ data })
}

export async function getCaseMessages(caseId: string): Promise<Message[]> {
  return await prisma.message.findMany({
    where: { caseId },
    orderBy: { timestamp: 'asc' }
  })
}

// Examination Results Management
export async function saveExaminationResults(
  caseId: string, 
  results: ExaminationResultType[]
): Promise<ExaminationResult[]> {
  // Delete existing results
  await prisma.examinationResult.deleteMany({
    where: { caseId }
  })

  // Create new results
  const data = results.map(result => ({
    caseId,
    name: result.name,
    type: result.type,
    category: result.category,
    urgency: result.urgency,
    value: result.type === 'quantitative' ? (result as any).value : null,
    unit: result.type === 'quantitative' ? (result as any).unit : null,
    rangeLow: result.type === 'quantitative' ? (result as any).range?.low : null,
    rangeHigh: result.type === 'quantitative' ? (result as any).range?.high : null,
    status: result.type === 'quantitative' ? (result as any).status : null,
    findings: result.type === 'descriptive' ? (result as any).findings : null,
    impression: result.type === 'descriptive' ? (result as any).impression : null,
    recommendation: result.type === 'descriptive' ? (result as any).recommendation : null,
    abnormalFlags: result.type === 'descriptive' ? (result as any).abnormalFlags : [],
    reportType: result.type === 'descriptive' ? (result as any).reportType : null
  }))

  return await prisma.examinationResult.createMany({
    data
  }).then(() => prisma.examinationResult.findMany({ where: { caseId } }))
}

// Investigation Results Management
export async function saveInvestigationResults(
  caseId: string, 
  results: InvestigationResultType[]
): Promise<InvestigationResult[]> {
  // Delete existing results
  await prisma.investigationResult.deleteMany({
    where: { caseId }
  })

  // Create new results
  const data = results.map(result => ({
    caseId,
    name: result.name,
    type: result.type,
    category: result.category,
    urgency: result.urgency,
    value: result.type === 'quantitative' ? (result as any).value : null,
    unit: result.type === 'quantitative' ? (result as any).unit : null,
    rangeLow: result.type === 'quantitative' ? (result as any).range?.low : null,
    rangeHigh: result.type === 'quantitative' ? (result as any).range?.high : null,
    status: result.type === 'quantitative' ? (result as any).status : null,
    findings: result.type === 'descriptive' ? (result as any).findings : null,
    impression: result.type === 'descriptive' ? (result as any).impression : null,
    recommendation: result.type === 'descriptive' ? (result as any).recommendation : null,
    abnormalFlags: result.type === 'descriptive' ? (result as any).abnormalFlags : [],
    reportType: result.type === 'descriptive' ? (result as any).reportType : null
  }))

  return await prisma.investigationResult.createMany({
    data
  }).then(() => prisma.investigationResult.findMany({ where: { caseId } }))
}

// Feedback Management
export async function saveFeedback(
  caseId: string, 
  feedback: FeedbackType
): Promise<Feedback> {
  return await prisma.feedback.upsert({
    where: { caseId },
    update: {
      diagnosis: feedback.diagnosis,
      keyLearningPoint: feedback.keyLearningPoint,
      whatYouDidWell: feedback.whatYouDidWell,
      whatCouldBeImproved: feedback.whatCouldBeImproved,
      clinicalTip: feedback.clinicalTip
    },
    create: {
      caseId,
      diagnosis: feedback.diagnosis,
      keyLearningPoint: feedback.keyLearningPoint,
      whatYouDidWell: feedback.whatYouDidWell,
      whatCouldBeImproved: feedback.whatCouldBeImproved,
      clinicalTip: feedback.clinicalTip
    }
  })
}

export async function saveDetailedFeedback(
  caseId: string,
  feedback: FeedbackType & {
    positiveQuotes?: { quote: string; explanation: string }[]
    improvementQuotes?: { quote: string; explanation: string }[]
    keyLearningPoint?: string
    clerkingStructure?: string
    missedOpportunities?: { opportunity: string; clinicalSignificance: string }[]
    clinicalReasoning?: string
    communicationNotes?: string
    clinicalPearls?: string[]
  }
): Promise<Feedback> {
  return await prisma.feedback.upsert({
    where: { caseId },
    update: {
      diagnosis: feedback.diagnosis,
      keyLearningPoint: feedback.keyLearningPoint,
      whatYouDidWell: feedback.whatYouDidWell,
      whatCouldBeImproved: feedback.whatCouldBeImproved,
      clinicalTip: feedback.clinicalTip,
      // positiveQuotes: feedback.positiveQuotes,
      // improvementQuotes: feedback.improvementQuotes,
      // clerkingStructure: feedback.clerkingStructure,
      missedOpportunities: feedback.missedOpportunities,
      clinicalReasoning: feedback.clinicalReasoning,
      // communicationNotes: feedback.communicationNotes,
      clinicalPearls: feedback.clinicalPearls
    },
    create: {
      caseId,
      diagnosis: feedback.diagnosis,
      keyLearningPoint: feedback.keyLearningPoint,
      whatYouDidWell: feedback.whatYouDidWell,
      whatCouldBeImproved: feedback.whatCouldBeImproved,
      clinicalTip: feedback.clinicalTip,
      // positiveQuotes: feedback.positiveQuotes,
      // improvementQuotes: feedback.improvementQuotes,
      // clerkingStructure: feedback.clerkingStructure,
      missedOpportunities: feedback.missedOpportunities,
      // clinicalReasoning: feedback.clinicalReasoning,
      // communicationNotes: feedback.communicationNotes,
      clinicalPearls: feedback.clinicalPearls
    }
  })
}

// Analytics and Statistics
export async function getUserStats(userId: string) {
  const cases = await prisma.case.findMany({
    where: { userId },
    include: { feedback: true }
  })

  const totalCases = cases.length
  const completedCases = cases.filter(c => c.completedAt).length
  const departments = await prisma.case.groupBy({
    by: ['departmentId'],
    where: { userId },
    _count: { departmentId: true }
  })

  return {
    totalCases,
    completedCases,
    completionRate: totalCases > 0 ? (completedCases / totalCases) * 100 : 0,
    departmentBreakdown: departments
  }
}

// Save messages from localStorage
export async function saveMessagesFromLocalStorage(
  caseId: string, 
  messages: any[]
): Promise<any> {
  // Delete existing messages for this case
  await prisma.message.deleteMany({ where: { caseId } });
  
  if (messages.length === 0) return [];
  
  // Create new messages
  const data = messages.map(msg => ({
    caseId,
    sender: msg.sender,
    text: msg.text,
    speakerLabel: msg.speakerLabel || null,
    timestamp: new Date(msg.timestamp)
  }));
  
  return await prisma.message.createMany({ data });
}

// Save examination results from localStorage
export async function saveExaminationResultsFromLocalStorage(
  caseId: string, 
  results: any[]
): Promise<any> {
  // Delete existing results
  await prisma.examinationResult.deleteMany({ where: { caseId } });
  
  if (results.length === 0) return [];
  
  // Create new results
  const data = results.map(result => ({
    caseId,
    name: result.name,
    type: result.type,
    category: result.category,
    urgency: result.urgency,
    value: result.value,
    unit: result.unit,
    rangeLow: result.range?.low,
    rangeHigh: result.range?.high,
    status: result.status,
    findings: result.findings,
    impression: result.impression,
    recommendation: result.recommendation,
    abnormalFlags: result.abnormalFlags || [],
    reportType: result.reportType
  }));
  
  return await prisma.examinationResult.createMany({ data });
}

// Save investigation results from localStorage
export async function saveInvestigationResultsFromLocalStorage(
  caseId: string, 
  results: any[]
): Promise<any> {
  // Delete existing results
  await prisma.investigationResult.deleteMany({ where: { caseId } });
  
  if (results.length === 0) return [];
  
  // Create new results
  const data = results.map(result => ({
    caseId,
    name: result.name,
    type: result.type,
    category: result.category,
    urgency: result.urgency,
    value: result.value,
    unit: result.unit,
    rangeLow: result.range?.low,
    rangeHigh: result.range?.high,
    status: result.status,
    findings: result.findings,
    impression: result.impression,
    recommendation: result.recommendation,
    abnormalFlags: result.abnormalFlags || [],
    reportType: result.reportType
  }));
  
  return await prisma.investigationResult.createMany({ data });
}

// Save comprehensive feedback
export async function saveComprehensiveFeedback(
  caseId: string, 
  feedback: any
): Promise<Feedback> {
  return await prisma.feedback.upsert({
    where: { caseId },
    update: {
      diagnosis: feedback.diagnosis,
      keyLearningPoint: feedback.keyLearningPoint,
      whatYouDidWell: feedback.whatYouDidWell,
      whatCouldBeImproved: feedback.clinicalOpportunities?.areasForImprovement || [],
      clinicalTip: feedback.clinicalReasoning,
      clinicalPearls: feedback.clinicalPearls,
      missedOpportunities: feedback.clinicalOpportunities?.missedOpportunities || []
    },
    create: {
      caseId,
      diagnosis: feedback.diagnosis,
      keyLearningPoint: feedback.keyLearningPoint,
      whatYouDidWell: feedback.whatYouDidWell,
      whatCouldBeImproved: feedback.clinicalOpportunities?.areasForImprovement || [],
      clinicalTip: feedback.clinicalReasoning,
      clinicalPearls: feedback.clinicalPearls,
      missedOpportunities: feedback.clinicalOpportunities?.missedOpportunities || []
    }
  });
}

// Save case report
export async function saveCaseReport(
  caseId: string, 
  caseReport: any
): Promise<any> {
  return await prisma.caseReport.upsert({
    where: { caseId },
    update: {
      patientInfo: caseReport.patientInfo,
      history: caseReport.history,
      examination: caseReport.examination,
      investigations: caseReport.investigations,
      assessment: caseReport.assessment,
      management: caseReport.management,
      learningPoints: caseReport.learningPoints || [],
      isVisible: caseReport.isVisible !== undefined ? caseReport.isVisible : true
    },
    create: {
      caseId,
      patientInfo: caseReport.patientInfo,
      history: caseReport.history,
      examination: caseReport.examination,
      investigations: caseReport.investigations,
      assessment: caseReport.assessment,
      management: caseReport.management,
      learningPoints: caseReport.learningPoints || [],
      isVisible: caseReport.isVisible !== undefined ? caseReport.isVisible : true
    }
  });
} 