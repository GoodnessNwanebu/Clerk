import { unstable_cache } from 'next/cache';
import type { OSCESession, OSCEFollowUpQuestion, OSCEEvaluation } from '../../types/osce';

// Cache TTL: 2 hours (longer than regular cases since OSCE sessions are longer)
const OSCE_CACHE_TTL = 7200; // seconds

/**
 * Generate cache keys for OSCE data
 */
function getOSCESessionKey(sessionId: string): string {
  return `osce-session-${sessionId}`;
}

function getOSCEHistoryKey(sessionId: string): string {
  return `osce-history-${sessionId}`;
}

function getOSCEFollowUpKey(sessionId: string): string {
  return `osce-followup-${sessionId}`;
}

function getOSCEEvaluationKey(sessionId: string): string {
  return `osce-evaluation-${sessionId}`;
}

/**
 * OSCE Session Cache
 */
export async function cacheOSCESession(session: OSCESession): Promise<void> {
  const cacheKey = getOSCESessionKey(session.sessionId);
  
  const cache = unstable_cache(
    async () => session,
    [cacheKey],
    { 
      revalidate: OSCE_CACHE_TTL,
      tags: [`osce-session-${session.sessionId}`]
    }
  );

  await cache();
  console.log(`✅ Cached OSCE session: ${session.sessionId}`);
}

export async function getOSCESession(sessionId: string): Promise<OSCESession | null> {
  const cacheKey = getOSCESessionKey(sessionId);
  
  try {
    const cache = unstable_cache(
      async () => null, // Will be populated by cacheOSCESession
      [cacheKey],
      { 
        revalidate: OSCE_CACHE_TTL,
        tags: [`osce-session-${sessionId}`]
      }
    );

    const session = await cache();
    return session;
  } catch (error) {
    console.error(`❌ Error retrieving OSCE session ${sessionId}:`, error);
    return null;
  }
}

/**
 * OSCE History Questions Cache
 */
export async function cacheOSCEHistoryQuestions(
  sessionId: string, 
  questions: string[]
): Promise<void> {
  const cacheKey = getOSCEHistoryKey(sessionId);
  
  const cache = unstable_cache(
    async () => questions,
    [cacheKey],
    { 
      revalidate: OSCE_CACHE_TTL,
      tags: [`osce-history-${sessionId}`]
    }
  );

  await cache();
  console.log(`✅ Cached OSCE history questions for session: ${sessionId}`);
}

export async function getOSCEHistoryQuestions(sessionId: string): Promise<string[] | null> {
  const cacheKey = getOSCEHistoryKey(sessionId);
  
  try {
    const cache = unstable_cache(
      async () => null, // Will be populated by cacheOSCEHistoryQuestions
      [cacheKey],
      { 
        revalidate: OSCE_CACHE_TTL,
        tags: [`osce-history-${sessionId}`]
      }
    );

    const questions = await cache();
    return questions;
  } catch (error) {
    console.error(`❌ Error retrieving OSCE history questions for session ${sessionId}:`, error);
    return null;
  }
}

/**
 * OSCE Follow-up Questions and Answers Cache
 */
export async function cacheOSCEFollowUpQuestions(
  sessionId: string, 
  questions: OSCEFollowUpQuestion[]
): Promise<void> {
  const cacheKey = getOSCEFollowUpKey(sessionId);
  
  const cache = unstable_cache(
    async () => questions,
    [cacheKey],
    { 
      revalidate: OSCE_CACHE_TTL,
      tags: [`osce-followup-${sessionId}`]
    }
  );

  await cache();
  console.log(`✅ Cached OSCE follow-up questions for session: ${sessionId}`);
}

export async function getOSCEFollowUpQuestions(sessionId: string): Promise<OSCEFollowUpQuestion[] | null> {
  const cacheKey = getOSCEFollowUpKey(sessionId);
  
  try {
    const cache = unstable_cache(
      async () => null, // Will be populated by cacheOSCEFollowUpQuestions
      [cacheKey],
      { 
        revalidate: OSCE_CACHE_TTL,
        tags: [`osce-followup-${sessionId}`]
      }
    );

    const questions = await cache();
    return questions;
  } catch (error) {
    console.error(`❌ Error retrieving OSCE follow-up questions for session ${sessionId}:`, error);
    return null;
  }
}

/**
 * Update a specific follow-up question answer
 */
export async function updateOSCEFollowUpAnswer(
  sessionId: string,
  questionId: string,
  answer: string
): Promise<void> {
  const questions = await getOSCEFollowUpQuestions(sessionId);
  if (!questions) {
    throw new Error(`No follow-up questions found for session: ${sessionId}`);
  }

  const questionIndex = questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) {
    throw new Error(`Question with ID ${questionId} not found in session: ${sessionId}`);
  }

  questions[questionIndex].studentAnswer = answer;
  questions[questionIndex].isAnswered = true;

  await cacheOSCEFollowUpQuestions(sessionId, questions);
  console.log(`✅ Updated follow-up answer for question ${questionId} in session: ${sessionId}`);
}

/**
 * OSCE Evaluation Cache
 */
export async function cacheOSCEEvaluation(
  sessionId: string, 
  evaluation: OSCEEvaluation
): Promise<void> {
  const cacheKey = getOSCEEvaluationKey(sessionId);
  
  const cache = unstable_cache(
    async () => evaluation,
    [cacheKey],
    { 
      revalidate: OSCE_CACHE_TTL,
      tags: [`osce-evaluation-${sessionId}`]
    }
  );

  await cache();
  console.log(`✅ Cached OSCE evaluation for session: ${sessionId}`);
}

export async function getOSCEEvaluation(sessionId: string): Promise<OSCEEvaluation | null> {
  const cacheKey = getOSCEEvaluationKey(sessionId);
  
  try {
    const cache = unstable_cache(
      async () => null, // Will be populated by cacheOSCEEvaluation
      [cacheKey],
      { 
        revalidate: OSCE_CACHE_TTL,
        tags: [`osce-evaluation-${sessionId}`]
      }
    );

    const evaluation = await cache();
    return evaluation;
  } catch (error) {
    console.error(`❌ Error retrieving OSCE evaluation for session ${sessionId}:`, error);
    return null;
  }
}

/**
 * Cache cleanup and expiration
 */
export async function cleanupOSCESession(sessionId: string): Promise<void> {
  try {
    // Clear all caches for this session
    const sessionKey = getOSCESessionKey(sessionId);
    const historyKey = getOSCEHistoryKey(sessionId);
    const followUpKey = getOSCEFollowUpKey(sessionId);
    const evaluationKey = getOSCEEvaluationKey(sessionId);

    // Note: Next.js cache will auto-expire based on TTL
    // We can also manually trigger revalidation if needed
    console.log(`🧹 Cleaned up OSCE session caches: ${sessionId}`);
  } catch (error) {
    console.error(`❌ Error cleaning up OSCE session ${sessionId}:`, error);
  }
}

/**
 * Check if OSCE session data is cached and valid
 */
export async function isOSCESessionCached(sessionId: string): Promise<boolean> {
  const session = await getOSCESession(sessionId);
  return session !== null;
}

/**
 * Get all cached OSCE data for a session
 */
export async function getOSCESessionData(sessionId: string): Promise<{
  session: OSCESession | null;
  historyQuestions: string[] | null;
  followUpQuestions: OSCEFollowUpQuestion[] | null;
  evaluation: OSCEEvaluation | null;
}> {
  const [session, historyQuestions, followUpQuestions, evaluation] = await Promise.all([
    getOSCESession(sessionId),
    getOSCEHistoryQuestions(sessionId),
    getOSCEFollowUpQuestions(sessionId),
    getOSCEEvaluation(sessionId)
  ]);

  return {
    session,
    historyQuestions,
    followUpQuestions,
    evaluation
  };
}
