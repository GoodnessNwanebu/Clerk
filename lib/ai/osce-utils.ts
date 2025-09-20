import { OSCEQuestion, OSCEFollowupQuestionsResponse, OSCEGenerationStatus } from '../../types/osce';

/**
 * Strongly typed localStorage storage for OSCE questions
 */
interface OSCEQuestionsStorage {
  caseId: string;
  questions: OSCEQuestion[];
  generatedAt: string;
}

/**
 * Retry mechanism with exponential backoff for background actions
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3,
  context: string = 'operation'
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (error instanceof Error) {
        // Check for retryable errors
        const isRetryable = 
          error.message.includes('429') || // Rate limit
          error.message.includes('rate limit') ||
          error.message.includes('500') || // Server error
          error.message.includes('502') || // Bad gateway
          error.message.includes('503') || // Service unavailable
          error.message.includes('504') || // Gateway timeout
          error.message.includes('network') ||
          error.message.includes('fetch');
        
        if (isRetryable && !isLastAttempt) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`🔄 [OSCE Utils] ${context} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      console.error(`❌ [OSCE Utils] ${context} failed after ${attempt + 1} attempts:`, error);
      throw error;
    }
  }
  throw new Error(`Max retries (${maxRetries}) exceeded for ${context}`);
};

/**
 * Update OSCE generation status in localStorage
 */
const updateOSCEStatus = (status: OSCEGenerationStatus): void => {
  localStorage.setItem(`osce-status-${status.caseId}`, JSON.stringify(status));
};

/**
 * Get OSCE generation status from localStorage
 */
export const getOSCEGenerationStatus = (caseId: string): OSCEGenerationStatus | null => {
  try {
    const stored = localStorage.getItem(`osce-status-${caseId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('❌ [OSCE Utils] Error retrieving status:', error);
    return null;
  }
};

/**
 * Generate OSCE follow-up questions in the background after case creation
 * Questions are stored in localStorage, answers are cached server-side
 * Includes retry mechanism with exponential backoff and status tracking
 */
export const generateOSCEFollowupQuestions = async (caseId: string, sessionId: string): Promise<OSCEQuestion[]> => {
  // Initialize status tracking
  const initialStatus: OSCEGenerationStatus = {
    caseId,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    startedAt: new Date().toISOString()
  };
  updateOSCEStatus(initialStatus);

  const generateQuestions = async (): Promise<OSCEQuestion[]> => {
    console.log('🎯 [OSCE Utils] Starting API call for case:', caseId);
    console.log('🔍 [OSCE Utils] Request details:', {
      url: '/api/ai/osce-followup-questions',
      method: 'POST',
      credentials: 'include',
      caseId,
      sessionId
    });
    
    const response = await fetch('/api/ai/osce-followup-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caseId,
        sessionId
      }),
      credentials: 'include', // Include session cookies
    });

    console.log('📡 [OSCE Utils] API response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [OSCE Utils] API error response:', errorText);
      throw new Error(`Failed to generate OSCE questions: ${response.status} - ${errorText}`);
    }

    const data: OSCEFollowupQuestionsResponse = await response.json();
    console.log('📋 [OSCE Utils] Parsed API response:', {
      success: data.success,
      questionsCount: data.questions?.length || 0,
      hasQuestions: !!data.questions
    });
    
    if (!data.success || !data.questions) {
      throw new Error('Invalid OSCE questions response');
    }

    // Validate we have exactly 10 questions with proper typing
    if (!Array.isArray(data.questions) || data.questions.length !== 10) {
      throw new Error(`Expected 10 questions, got ${data.questions?.length || 0}`);
    }

    // Validate each question has required fields
    data.questions.forEach((question, index) => {
      if (!question.id || !question.domain || !question.question) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }
    });

    console.log('✅ [OSCE Utils] Generated', data.questions.length, 'questions');

    // Store questions in localStorage with strong typing
    const osceQuestions: OSCEQuestionsStorage = {
      caseId,
      questions: data.questions,
      generatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`osce-questions-${caseId}`, JSON.stringify(osceQuestions));
    
    console.log('💾 [OSCE Utils] Questions stored in localStorage:', {
      caseId,
      questionsCount: data.questions.length,
      storageKey: `osce-questions-${caseId}`,
      generatedAt: osceQuestions.generatedAt
    });
    
    return data.questions;
  };

  try {
    // Update status to generating
    updateOSCEStatus({
      ...initialStatus,
      status: 'generating',
      attempts: 1
    });

    // Use retry mechanism with exponential backoff
    const questions = await retryWithBackoff(
      generateQuestions,
      3, // Max 3 attempts
      `OSCE question generation for case ${caseId}`
    );

    // Update status to completed
    updateOSCEStatus({
      ...initialStatus,
      status: 'completed',
      attempts: 1,
      completedAt: new Date().toISOString()
    });

    return questions;

  } catch (error) {
    // Update status to failed
    updateOSCEStatus({
      ...initialStatus,
      status: 'failed',
      attempts: 3,
      lastError: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date().toISOString()
    });

    throw error;
  }
};

/**
 * Retrieve OSCE questions from localStorage with strong typing
 */
export const getOSCEQuestions = (caseId: string): OSCEQuestion[] | null => {
  try {
    const stored = localStorage.getItem(`osce-questions-${caseId}`);
    if (!stored) return null;
    
    const data: OSCEQuestionsStorage = JSON.parse(stored);
    
    // Validate the stored data structure
    if (!data.caseId || !Array.isArray(data.questions) || !data.generatedAt) {
      console.warn('❌ [OSCE Utils] Invalid stored question format, clearing...');
      localStorage.removeItem(`osce-questions-${caseId}`);
      return null;
    }
    
    // Validate each question has required fields
    const isValid = data.questions.every(q => 
      q.id && q.domain && q.question && typeof q.id === 'string'
    );
    
    if (!isValid) {
      console.warn('❌ [OSCE Utils] Invalid question structure, clearing...');
      localStorage.removeItem(`osce-questions-${caseId}`);
      return null;
    }
    
    return data.questions;
  } catch (error) {
    console.error('❌ [OSCE Utils] Error retrieving questions:', error);
    // Clear corrupted data
    localStorage.removeItem(`osce-questions-${caseId}`);
    return null;
  }
};

/**
 * Clear OSCE questions from localStorage (called after session completion)
 */
export const clearOSCEQuestions = (caseId: string): void => {
  try {
    localStorage.removeItem(`osce-questions-${caseId}`);
    console.log('🗑️ [OSCE Utils] Cleared questions for case:', caseId);
  } catch (error) {
    console.error('❌ [OSCE Utils] Error clearing questions:', error);
  }
};

/**
 * Check if OSCE questions are ready for a case
 */
export const areOSCEQuestionsReady = (caseId: string): boolean => {
  const questions = getOSCEQuestions(caseId);
  return questions !== null && questions.length === 10;
};
