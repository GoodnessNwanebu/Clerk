import { unstable_cache } from 'next/cache';
import { OSCEQuestionWithAnswer } from '../../types/osce';

// Cache TTL: 2 hours (longer than typical OSCE session)
const CACHE_TTL = 7200; // seconds

/**
 * Generate a cache key for OSCE answers
 */
function getOSCEAnswersCacheKey(caseId: string): string {
  return `osce-answers-${caseId}`;
}

/**
 * Strongly typed OSCE answers cache structure
 */
interface CachedOSCEAnswers {
  caseId: string;
  answers: Record<string, string>; // questionId -> correct answer
  questionData: OSCEQuestionWithAnswer[];
  cachedAt: Date;
  expiresAt: Date;
}

/**
 * Store OSCE answers in Next.js cache
 */
export async function cacheOSCEAnswers(
  caseId: string,
  questions: OSCEQuestionWithAnswer[]
): Promise<void> {
  const cacheKey = getOSCEAnswersCacheKey(caseId);
  
  // Convert questions to answers map for quick lookup
  const answersMap = questions.reduce((acc, q) => {
    acc[q.id] = q.answer;
    return acc;
  }, {} as Record<string, string>);

  const cachedData: CachedOSCEAnswers = {
    caseId,
    answers: answersMap,
    questionData: questions,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + CACHE_TTL * 1000)
  };

  // Store in Next.js cache
  const cache = unstable_cache(
    async () => cachedData,
    [cacheKey],
    { 
      revalidate: CACHE_TTL,
      tags: [`osce-answers-${caseId}`]
    }
  );

  await cache();
  console.log(`✅ [OSCE Cache] Cached answers for case: ${caseId}`);
}

/**
 * Get OSCE answers from cache
 */
export async function getOSCEAnswers(caseId: string): Promise<CachedOSCEAnswers | null> {
  const cacheKey = getOSCEAnswersCacheKey(caseId);

  try {
    // Create a cache function that returns null (cache will return actual data if cached)
    const cache = unstable_cache(
      async (): Promise<CachedOSCEAnswers | null> => null,
      [cacheKey],
      { 
        revalidate: CACHE_TTL,
        tags: [`osce-answers-${caseId}`]
      }
    );

    const cachedData = await cache();

    if (cachedData && cachedData.expiresAt > new Date()) {
      console.log(`✅ [OSCE Cache] Retrieved answers from cache for case: ${caseId}`);
      return cachedData;
    }

    console.log(`❌ [OSCE Cache] No valid cached answers found for case: ${caseId}`);
    return null;

  } catch (error) {
    console.error(`❌ [OSCE Cache] Error retrieving answers for case ${caseId}:`, error);
    return null;
  }
}

/**
 * Get specific answer for a question
 */
export async function getOSCEAnswer(caseId: string, questionId: string): Promise<string | null> {
  const cachedAnswers = await getOSCEAnswers(caseId);
  return cachedAnswers?.answers[questionId] || null;
}

/**
 * Invalidate OSCE answers cache for a specific case
 */
export async function invalidateOSCEAnswers(caseId: string): Promise<void> {
  try {
    const { revalidateTag } = await import('next/cache');
    await revalidateTag(`osce-answers-${caseId}`);
    console.log(`✅ [OSCE Cache] Invalidated answers cache for case: ${caseId}`);
  } catch (error) {
    console.error(`❌ [OSCE Cache] Error invalidating answers cache for case ${caseId}:`, error);
  }
}

/**
 * Check if OSCE answers are cached and valid
 */
export async function areOSCEAnswersCached(caseId: string): Promise<boolean> {
  const cachedData = await getOSCEAnswers(caseId);
  return cachedData !== null && cachedData.expiresAt > new Date();
}
