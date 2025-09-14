import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../../lib/auth';
import { ai, MODEL, parseJsonResponse, handleApiError } from '../../../../lib/ai/ai-utils';

interface GenerateOSCEQuestionsRequest {
  caseHistory: string;
  diagnosis: string;
  department: string;
}

interface OSCEFollowUpQuestion {
  question: string;
  category: 'diagnosis' | 'management' | 'investigation' | 'complications' | 'clinical reasoning';
}

interface GenerateOSCEQuestionsResponse {
  success: boolean;
  questions: OSCEFollowUpQuestion[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(auth) as { user?: { email?: string } } | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { caseHistory, diagnosis, department }: GenerateOSCEQuestionsRequest = await request.json();
    
    console.log('🎯 OSCE Questions generation request:', { 
      department, 
      diagnosis: diagnosis.substring(0, 50) + '...' 
    });

    // Validate required fields
    if (!caseHistory || !diagnosis || !department) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: caseHistory, diagnosis, department' },
        { status: 400 }
      );
    }

    // Generate OSCE follow-up questions prompt
    const prompt = `
You are an expert medical educator creating OSCE (Objective Structured Clinical Examination) follow-up questions.

**Case Context:**
- Department: ${department}
- Case History: ${caseHistory}
- Target Diagnosis: ${diagnosis}

**Task:**
Generate exactly 10 follow-up questions that a medical student should be able to answer after taking this patient's history. These questions should test:

1. **Diagnostic reasoning** - what is the diagnosis and understanding the condition
2. **Management principles** - treatment approaches
3. **Investigations** - appropriate tests/workup
4. **Complications** - potential problems
5. **Clinical reasoning** - risk factors, social factors, and reasoning based on the history taken

**IMPORTANT:** The first question must always ask about the student's diagnosis for this case.

**Requirements:**
- Questions should be appropriate for medical students
- Cover different aspects of the condition
- Be specific to the case presented
- Test practical clinical knowledge

**Response Format:**
Return a JSON array with exactly 10 questions, each with:
- question: The question text
- category: One of "diagnosis", "management", "investigation", "complications", "clinical reasoning"


Example format:
[
  {
    "question": "What is your diagnosis for this patient?",
    "category": "diagnosis"
  },
  {
    "question": "What are the first-line investigations you would order?",
    "category": "investigation"
  }
]

Generate 10 questions now:`;

    // Call AI service
    const response = await ai.generateContent({
      model: MODEL,
      contents: [{ text: prompt }],
    });

    const responseText = response.text;
    console.log('🤖 AI Response for OSCE questions:', responseText.substring(0, 200) + '...');

    // Parse the JSON response
    const questions = parseJsonResponse<OSCEFollowUpQuestion[]>(responseText, 'OSCE Questions');
    
    // Validate we got exactly 10 questions
    if (!Array.isArray(questions) || questions.length !== 10) {
      throw new Error(`Expected exactly 10 questions, got ${questions.length}`);
    }

    // Validate question structure
    for (const question of questions) {
      if (!question.question || !question.category ) {
        throw new Error('Invalid question structure: missing required fields');
      }
      if (!['diagnosis', 'management', 'investigation', 'complications', 'prognosis'].includes(question.category)) {
        throw new Error(`Invalid category: ${question.category}`);
      }
     
    }

    console.log('✅ Successfully generated 10 OSCE questions');

    return NextResponse.json({
      success: true,
      questions: questions
    } as GenerateOSCEQuestionsResponse);

  } catch (error) {
    console.error('❌ Error generating OSCE questions:', error);
    return handleApiError(error, 'Failed to generate OSCE questions');
  }
}
