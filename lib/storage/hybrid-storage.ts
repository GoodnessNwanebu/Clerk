import { 
  SecondaryContext, 
  LocalStorageCase, 
  StorageManager 
} from '../../types/sessions';

const STORAGE_PREFIX = 'clerksmart_secondary_';

/**
 * Hybrid storage manager for secondary context
 * Manages localStorage for secondary context only (conversation, examination results, etc.)
 * Primary context is managed via JWT cookies
 */
export class HybridCaseStorage implements StorageManager {
  private caseId: string;
  private storageKey: string;

  constructor(caseId: string) {
    this.caseId = caseId;
    this.storageKey = `${STORAGE_PREFIX}${caseId}`;
  }

  /**
   * Save secondary context to localStorage
   */
  async saveSecondaryContext(caseId: string, context: SecondaryContext): Promise<boolean> {
    try {
      const data: LocalStorageCase = {
        caseId,
        secondaryContext: context,
        lastUpdated: new Date().toISOString(),
        isActive: true
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save secondary context to localStorage:', error);
      return false;
    }
  }

  /**
   * Load secondary context from localStorage
   */
  async loadSecondaryContext(caseId: string): Promise<SecondaryContext | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data) as LocalStorageCase;

      // Validate the data structure
      if (!parsed.caseId || !parsed.secondaryContext) {
        console.warn('Invalid secondary context data in localStorage');
        return null;
      }

      // Validate secondary context structure
      if (!this.validateSecondaryContext(parsed.secondaryContext)) {
        console.warn('Invalid secondary context structure');
        return null;
      }

      return parsed.secondaryContext;
    } catch (error) {
      console.error('Failed to load secondary context from localStorage:', error);
      return null;
    }
  }

  /**
   * Update specific parts of secondary context
   */
  async updateSecondaryContext(caseId: string, updates: Partial<SecondaryContext>): Promise<boolean> {
    try {
      const existing = await this.loadSecondaryContext(caseId);
      if (!existing) {
        return false;
      }

      const updated = { ...existing, ...updates };
      return await this.saveSecondaryContext(caseId, updated);
    } catch (error) {
      console.error('Failed to update secondary context:', error);
      return false;
    }
  }

  /**
   * Clear secondary context from localStorage
   */
  async clearSecondaryContext(caseId: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storageKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to clear secondary context from localStorage:', error);
      return false;
    }
  }

  /**
   * Get all active cases from localStorage
   */
  async getAllActiveCases(): Promise<LocalStorageCase[]> {
    const cases: LocalStorageCase[] = [];

    try {
      if (typeof window === 'undefined') {
        return cases;
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data) as LocalStorageCase;
              if (parsed.isActive && this.validateSecondaryContext(parsed.secondaryContext)) {
                cases.push(parsed);
              }
            } catch (error) {
              console.warn('Invalid case data:', key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get all active cases:', error);
    }

    return cases;
  }

  /**
   * Clear all cases from localStorage
   */
  async clearAllCases(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear all cases:', error);
      return false;
    }
  }

  /**
   * Get storage size for debugging
   */
  getSize(): number {
    try {
      if (typeof window === 'undefined') {
        return 0;
      }

      const data = localStorage.getItem(this.storageKey);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get total storage size for all cases
   */
  getTotalSize(): number {
    try {
      if (typeof window === 'undefined') {
        return 0;
      }

      let totalSize = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            totalSize += new Blob([data]).size;
          }
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if case exists in localStorage
   */
  exists(): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      return localStorage.getItem(this.storageKey) !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate secondary context structure
   */
  private validateSecondaryContext(context: unknown): context is SecondaryContext {
    if (!context || typeof context !== 'object') {
      return false;
    }

    const ctx = context as SecondaryContext;

    return (
      Array.isArray(ctx.messages) &&
      typeof ctx.preliminaryDiagnosis === 'string' &&
      typeof ctx.examinationPlan === 'string' &&
      typeof ctx.investigationPlan === 'string' &&
      Array.isArray(ctx.examinationResults) &&
      Array.isArray(ctx.investigationResults) &&
      typeof ctx.finalDiagnosis === 'string' &&
      typeof ctx.managementPlan === 'string' &&
      (ctx.feedback === null || typeof ctx.feedback === 'object')
    );
  }
}

/**
 * Utility functions for managing multiple cases
 */
export class HybridStorageUtils {
  /**
   * Get all stored cases with metadata
   */
  static async getAllCases(): Promise<LocalStorageCase[]> {
    const storage = new HybridCaseStorage('');
    return await storage.getAllActiveCases();
  }

  /**
   * Clear all stored cases
   */
  static async clearAllCases(): Promise<boolean> {
    const storage = new HybridCaseStorage('');
    return await storage.clearAllCases();
  }

  /**
   * Get total storage size
   */
  static getTotalSize(): number {
    const storage = new HybridCaseStorage('');
    return storage.getTotalSize();
  }

  /**
   * Get case metadata without loading full context
   */
  static getCaseMetadata(caseId: string): { lastUpdated: string; isActive: boolean } | null {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const storageKey = `${STORAGE_PREFIX}${caseId}`;
      const data = localStorage.getItem(storageKey);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data) as LocalStorageCase;
      return {
        lastUpdated: parsed.lastUpdated,
        isActive: parsed.isActive
      };
    } catch (error) {
      console.error('Failed to get case metadata:', error);
      return null;
    }
  }

  /**
   * Check if case is active
   */
  static isCaseActive(caseId: string): boolean {
    const metadata = this.getCaseMetadata(caseId);
    return metadata?.isActive ?? false;
  }

  /**
   * Get last updated time for case
   */
  static getCaseLastUpdated(caseId: string): Date | null {
    const metadata = this.getCaseMetadata(caseId);
    if (!metadata) {
      return null;
    }

    try {
      return new Date(metadata.lastUpdated);
    } catch {
      return null;
    }
  }
}
