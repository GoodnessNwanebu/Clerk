/**
 * Retry helper function that attempts to execute a function multiple times before failing
 * @param fn - The async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param delayMs - Delay between attempts in milliseconds (default: 1000)
 * @param backoffMultiplier - Multiplier for exponential backoff (default: 1.5)
 * @returns Promise that resolves with the function result or rejects after all attempts fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 1.5
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const currentDelay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      console.warn(`Attempt ${attempt} failed, retrying in ${currentDelay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Retry helper that fails silently - returns null instead of throwing
 * @param fn - The async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param delayMs - Delay between attempts in milliseconds (default: 1000)
 * @param backoffMultiplier - Multiplier for exponential backoff (default: 1.5)
 * @returns Promise that resolves with the function result or null if all attempts fail
 */
export async function retrySilently<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 1.5
): Promise<T | null> {
  try {
    return await retry(fn, maxAttempts, delayMs, backoffMultiplier);
  } catch (error) {
    console.error(`All ${maxAttempts} attempts failed, failing silently:`, error);
    return null;
  }
}
