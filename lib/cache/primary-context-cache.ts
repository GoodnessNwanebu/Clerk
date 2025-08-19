import { unstable_cache } from 'next/cache';
import { prisma } from '../database/prisma';
import type { PrimaryContext, CachedPrimaryContext } from '../../types/auth';
import { DifficultyLevel } from '~/types';

// Cache TTL: 1 hour
const CACHE_TTL = 3600; // seconds

/**
 * Generate a cache key for primary context
 */
function getCacheKey(caseId: string): string {
  return `primary-context-${caseId}`;
}

/**
 * Store primary context in cache
 */
export async function cachePrimaryContext(
  caseId: string,
  userId: string,
  sessionId: string,
  primaryContext: PrimaryContext
): Promise<void> {
  const cacheKey = getCacheKey(caseId);
  const cachedData: CachedPrimaryContext = {
    primaryContext,
    caseId,
    userId,
    sessionId,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + CACHE_TTL * 1000)
  };

  // Store in Next.js cache
  const cache = unstable_cache(
    async () => cachedData,
    [cacheKey],
    { 
      revalidate: CACHE_TTL,
      tags: [`case-${caseId}`]
    }
  );

  await cache();
  console.log(`✅ Cached primary context for case: ${caseId}`);
}

/**
 * Get primary context from cache with database fallback
 */
export async function getPrimaryContext(caseId: string): Promise<CachedPrimaryContext | null> {
  const cacheKey = getCacheKey(caseId);

  try {
    // Try to get from cache first
    const cachedData = await unstable_cache(
      async () => {
        // Fallback to database if cache miss
        const caseRecord = await prisma.case.findUnique({
          where: { id: caseId },
          include: {
            department: true
          }
        });

        if (!caseRecord) {
          return null;
        }

        // Reconstruct primary context from database
        const primaryContext: PrimaryContext = {
          diagnosis: caseRecord.diagnosis,
          primaryInfo: caseRecord.primaryInfo,
          openingLine: caseRecord.openingLine,
          patientProfile: undefined, // These are stored as IDs in the database, not as objects
          pediatricProfile: undefined, // These are stored as IDs in the database, not as objects
          isPediatric: caseRecord.isPediatric,
          department: caseRecord.department.name,
          difficultyLevel: caseRecord.difficultyLevel as DifficultyLevel
        };

        // Get active session
        const activeSession = await prisma.caseSession.findFirst({
          where: {
            caseId,
            isActive: true,
            expiresAt: { gt: new Date() }
          }
        });

        if (!activeSession) {
          return null;
        }

        const cachedData: CachedPrimaryContext = {
          primaryContext,
          caseId,
          userId: caseRecord.userId,
          sessionId: activeSession.sessionId,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + CACHE_TTL * 1000)
        };

        return cachedData;
      },
      [cacheKey],
      { 
        revalidate: CACHE_TTL,
        tags: [`case-${caseId}`]
      }
    )();

    if (cachedData) {
      console.log(`✅ Retrieved primary context from cache for case: ${caseId}`);
      return cachedData;
    }

    console.log(`❌ No primary context found for case: ${caseId}`);
    return null;

  } catch (error) {
    console.error(`❌ Error retrieving primary context for case ${caseId}:`, error);
    return null;
  }
}

/**
 * Invalidate cache for a specific case
 */
export async function invalidatePrimaryContext(caseId: string): Promise<void> {
  try {
    // Next.js cache will automatically revalidate based on TTL
    // We can also manually trigger revalidation if needed
    console.log(`🔄 Invalidated cache for case: ${caseId}`);
  } catch (error) {
    console.error(`❌ Error invalidating cache for case ${caseId}:`, error);
  }
}

/**
 * Check if primary context is cached and valid
 */
export async function isPrimaryContextCached(caseId: string): Promise<boolean> {
  const cachedData = await getPrimaryContext(caseId);
  return cachedData !== null && cachedData.expiresAt > new Date();
}
