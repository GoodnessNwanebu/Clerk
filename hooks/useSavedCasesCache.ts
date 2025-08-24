import { useState, useEffect, useCallback } from 'react';

interface CompletedCase {
  id: string;
  diagnosis: string;
  department: { name: string };
  savedAt: string;
  completedAt: string;
  messages?: any[];
  examinationResults?: any[];
  investigationResults?: any[];
  feedback?: any;
  caseReport?: any;
}

interface SavedCasesCache {
  cases: CompletedCase[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchCases: () => Promise<void>;
  refreshCases: () => Promise<void>;
  clearCache: () => void;
  addCase: (newCase: CompletedCase) => void;
  removeCase: (caseId: string) => void;
  updateCase: (caseId: string, updates: Partial<CompletedCase>) => void;
}

const CACHE_KEY = 'savedCasesCache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useSavedCasesCache = (userEmail?: string | null): SavedCasesCache => {
  const [cases, setCases] = useState<CompletedCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { cases: cachedCases, lastFetched: cachedTime } = JSON.parse(cached);
          const now = Date.now();
          const cacheAge = now - cachedTime;
          
          console.log(`🔍 Cache status: ${cachedCases.length} cases, age: ${Math.round(cacheAge / 1000)}s, TTL: ${Math.round(CACHE_DURATION / 1000)}s`);
          
          // Check if cache is still valid
          if (cachedTime && cacheAge < CACHE_DURATION) {
            setCases(cachedCases);
            setLastFetched(cachedTime);
            console.log('✅ Loaded saved cases from cache');
            return true; // Cache is valid
          } else {
            console.log('❌ Cache expired or invalid');
          }
        } else {
          console.log('❌ No cache found');
        }
      } catch (error) {
        console.warn('Failed to load cached saved cases:', error);
      }
      return false; // Cache is invalid or doesn't exist
    };

    const cacheValid = loadCachedData();
    
    // Only fetch if cache is invalid and we have a user email
    if (!cacheValid && userEmail) {
      console.log('🔄 Cache invalid or missing, fetching fresh data...');
      fetchCases();
    } else if (cacheValid) {
      console.log('✅ Using cached data, no API call needed');
    }
  }, [userEmail]); // Only depend on userEmail, not fetchCases to avoid loops

  // Save data to cache
  const saveToCache = useCallback((casesData: CompletedCase[]) => {
    try {
      const cacheData = {
        cases: casesData,
        lastFetched: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`💾 Cached ${casesData.length} saved cases`);
    } catch (error) {
      console.warn('Failed to save cached saved cases:', error);
    }
  }, []);

  // Fetch cases from API
  const fetchCases = useCallback(async () => {
    if (!userEmail) return;

    try {
      console.log('🔄 Fetching saved cases from API...');
      setIsLoading(true);
      setError(null);
      
      const url = `/api/cases/completed?userEmail=${encodeURIComponent(userEmail)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load saved cases');
      }

      const data = await response.json();
      
      if (data.success && data.cases) {
        console.log(`✅ Fetched ${data.cases.length} cases from API`);
        setCases(data.cases);
        setLastFetched(Date.now());
        saveToCache(data.cases);
      } else {
        throw new Error('Invalid data received');
      }
    } catch (error) {
      console.error('Error fetching completed cases:', error);
      setError(error instanceof Error ? error.message : 'Failed to load saved cases');
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, saveToCache]);

  // Refresh cases (force fetch from API)
  const refreshCases = useCallback(async () => {
    setLastFetched(null); // Clear cache timestamp to force refresh
    await fetchCases();
  }, [fetchCases]);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCases([]);
      setLastFetched(null);
      setError(null);
    } catch (error) {
      console.warn('Failed to clear cached saved cases:', error);
    }
  }, []);

  // Add a new case to cache
  const addCase = useCallback((newCase: CompletedCase) => {
    setCases(prevCases => {
      const updatedCases = [newCase, ...prevCases];
      saveToCache(updatedCases);
      return updatedCases;
    });
  }, [saveToCache]);

  // Remove a case from cache
  const removeCase = useCallback((caseId: string) => {
    setCases(prevCases => {
      const updatedCases = prevCases.filter(c => c.id !== caseId);
      saveToCache(updatedCases);
      return updatedCases;
    });
  }, [saveToCache]);

  // Update a case in cache
  const updateCase = useCallback((caseId: string, updates: Partial<CompletedCase>) => {
    setCases(prevCases => {
      const updatedCases = prevCases.map(c => 
        c.id === caseId ? { ...c, ...updates } : c
      );
      saveToCache(updatedCases);
      return updatedCases;
    });
  }, [saveToCache]);



  return {
    cases,
    isLoading,
    error,
    lastFetched,
    fetchCases,
    refreshCases,
    clearCache,
    addCase,
    removeCase,
    updateCase
  };
};
