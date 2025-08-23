import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ 
        error: 'Case ID is required' 
      }, { status: 400 });
    }

    // Fetch the case with all related data
    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        department: true,
        patientProfile: true,
        pediatricProfile: true,
        messages: {
          orderBy: { timestamp: 'asc' }
        },
        feedback: true,
        examinationResults: true,
        investigationResults: true,
        caseReport: true
      }
    });

    if (!caseData) {
      return NextResponse.json({ 
        error: 'Case not found' 
      }, { status: 404 });
    }

    // Calculate time spent
    const timeSpent = caseData.completedAt && caseData.startedAt 
      ? Math.round((new Date(caseData.completedAt).getTime() - new Date(caseData.startedAt).getTime()) / (1000 * 60))
      : 0;

    // Generate clinical summary from the data
    const clinicalSummary = generateClinicalSummary(caseData);

    return NextResponse.json({ 
      success: true, 
      case: {
        ...caseData,
        timeSpent,
        clinicalSummary
      }
    });

  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

function generateClinicalSummary(caseData: any): string {
  const { patientProfile, messages, examinationResults, investigationResults, feedback } = caseData;
  
  // Extract patient demographics
  const age = patientProfile?.age || 'unknown age';
  const occupation = patientProfile?.occupation || 'patient';
  const educationLevel = patientProfile?.educationLevel || 'basic';
  
  // Extract presenting complaint from first patient message
  const firstPatientMessage = messages.find((msg: any) => msg.sender === 'patient');
  const presentingComplaint = firstPatientMessage?.text || 'presented with symptoms';
  
  // Extract key examination findings
  const vitalSigns = examinationResults.filter((exam: any) => exam.category === 'vital_signs');
  const systemExam = examinationResults.filter((exam: any) => exam.category === 'system_examination');
  
  // Extract key investigation results
  const labResults = investigationResults.filter((inv: any) => inv.category === 'laboratory');
  const imagingResults = investigationResults.filter((inv: any) => inv.category === 'imaging');
  
  // Build the clinical summary
  let summary = `A ${age}-year-old ${occupation} with ${educationLevel} education level presented with ${presentingComplaint}. `;
  
  // Add vital signs if available
  if (vitalSigns.length > 0) {
    const vitalSignsText = vitalSigns.map((vital: any) => {
      if (vital.type === 'quantitative' && vital.value && vital.unit) {
        return `${vital.name} ${vital.value} ${vital.unit}`;
      }
      return vital.name;
    }).join(', ');
    summary += `On examination, vital signs showed ${vitalSignsText}. `;
  }
  
  // Add system examination findings
  if (systemExam.length > 0) {
    const examFindings = systemExam.map((exam: any) => exam.findings).filter(Boolean).join('. ');
    if (examFindings) {
      summary += `${examFindings}. `;
    }
  }
  
  // Add investigation results
  if (labResults.length > 0 || imagingResults.length > 0) {
    const results = [...labResults, ...imagingResults];
    const resultsText = results.map((result: any) => {
      if (result.type === 'quantitative' && result.value && result.unit) {
        return `${result.name} ${result.value} ${result.unit}`;
      }
      return result.name;
    }).join(', ');
    summary += `Investigations revealed ${resultsText}. `;
  }
  
  // Add final diagnosis and management from feedback
  if (feedback?.diagnosis) {
    summary += `A diagnosis of ${feedback.diagnosis} was made. `;
  }
  
  // Add management plan if available
  if (feedback?.clinicalReasoning) {
    summary += `Management included ${feedback.clinicalReasoning}.`;
  }
  
  return summary;
} 