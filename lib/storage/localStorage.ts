import { Message, CaseState, ExaminationResult, InvestigationResult, Feedback, ComprehensiveFeedback } from '../../types'

const STORAGE_PREFIX = 'clerksmart_case_'

export interface LocalStorageCase {
  caseId: string
  department: string | null
  conversation: Message[]
  // Only store secondary context - primary context is in cache
  secondaryContext: {
    preliminaryDiagnosis: string
    examinationPlan: string
    investigationPlan: string
    examinationResults: ExaminationResult[]
    investigationResults: InvestigationResult[]
    finalDiagnosis: string
    managementPlan: string
    feedback: Feedback | ComprehensiveFeedback | null
  }
  lastUpdated: string
}

export class ConversationStorage {
  private caseId: string
  private storageKey: string

  constructor(caseId: string) {
    this.caseId = caseId
    this.storageKey = `${STORAGE_PREFIX}${caseId}`
  }

  // Save conversation to localStorage (secondary context only)
  saveConversation(messages: Message[], caseState?: Partial<CaseState>): boolean {
    try {
      console.log(`💾 [ConversationStorage.saveConversation] Saving conversation to localStorage for case: ${this.caseId}, messages: ${messages.length}`);
      
      const data: LocalStorageCase = {
        caseId: this.caseId,
        department: caseState?.department || null,
        conversation: messages,
        secondaryContext: {
          preliminaryDiagnosis: caseState?.preliminaryDiagnosis || '',
          examinationPlan: caseState?.examinationPlan || '',
          investigationPlan: caseState?.investigationPlan || '',
          examinationResults: caseState?.examinationResults || [],
          investigationResults: caseState?.investigationResults || [],
          finalDiagnosis: caseState?.finalDiagnosis || '',
          managementPlan: caseState?.managementPlan || '',
          feedback: caseState?.feedback || null
        },
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      console.log(`✅ [ConversationStorage.saveConversation] Successfully saved conversation to localStorage for case: ${this.caseId}`);
      return true
    } catch (error) {
      console.error('Failed to save conversation to localStorage:', error)
      return false
    }
  }

  // Load conversation from localStorage
  loadConversation(): LocalStorageCase | null {
    try {
      console.log(`📖 [ConversationStorage.loadConversation] Loading conversation from localStorage for case: ${this.caseId}, key: ${this.storageKey}`);
      
      const data = localStorage.getItem(this.storageKey)
      if (!data) {
        console.log(`❌ [ConversationStorage.loadConversation] No data found in localStorage for case: ${this.caseId}`);
        return null
      }
      
      const parsed = JSON.parse(data) as LocalStorageCase
      
      // Validate the data structure
      if (!parsed.caseId || !Array.isArray(parsed.conversation)) {
        console.warn('Invalid conversation data in localStorage')
        return null
      }
      
      console.log(`✅ [ConversationStorage.loadConversation] Successfully loaded conversation from localStorage for case: ${this.caseId}, messages: ${parsed.conversation.length}`);
      return parsed
    } catch (error) {
      console.error('Failed to load conversation from localStorage:', error)
      return null
    }
  }

  // Add a single message to conversation
  addMessage(message: Message): boolean {
    try {
      const existing = this.loadConversation()
      if (existing) {
        existing.conversation.push(message)
        existing.lastUpdated = new Date().toISOString()
        localStorage.setItem(this.storageKey, JSON.stringify(existing))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to add message to localStorage:', error)
      return false
    }
  }

  // Update secondary context in localStorage
  updateSecondaryContext(secondaryContext: Partial<LocalStorageCase['secondaryContext']>): boolean {
    try {
      const existing = this.loadConversation()
      if (existing) {
        existing.secondaryContext = { ...existing.secondaryContext, ...secondaryContext }
        existing.lastUpdated = new Date().toISOString()
        localStorage.setItem(this.storageKey, JSON.stringify(existing))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update secondary context in localStorage:', error)
      return false
    }
  }

  // Clear conversation from localStorage
  clear(): boolean {
    try {
      console.log(`🗑️ [ConversationStorage.clear] Clearing localStorage for case: ${this.caseId}, key: ${this.storageKey}`);
      console.trace('Stack trace for localStorage clear');
      localStorage.removeItem(this.storageKey)
      console.log(`✅ [ConversationStorage.clear] Successfully cleared localStorage for case: ${this.caseId}`);
      return true
    } catch (error) {
      console.error('Failed to clear conversation from localStorage:', error)
      return false
    }
  }

  // Check if conversation exists in localStorage
  exists(): boolean {
    try {
      return localStorage.getItem(this.storageKey) !== null
    } catch (error) {
      return false
    }
  }

  // Get storage size (for debugging)
  getSize(): number {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? new Blob([data]).size : 0
    } catch (error) {
      return 0
    }
  }
}

// Utility functions for managing multiple cases
export const ConversationStorageUtils = {
  // Get all stored conversations
  getAllConversations(): LocalStorageCase[] {
    const conversations: LocalStorageCase[] = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const data = localStorage.getItem(key)
          if (data) {
            try {
              const parsed = JSON.parse(data) as LocalStorageCase
              conversations.push(parsed)
            } catch (error) {
              console.warn('Invalid conversation data:', key)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get all conversations:', error)
    }
    
    return conversations
  },

  // Clear all conversations
  clearAll(): boolean {
    try {
      console.log(`🗑️ [ConversationStorageUtils.clearAll] Clearing ALL conversation localStorage data`);
      console.trace('Stack trace for clearAll');
      
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      console.log(`🗑️ [ConversationStorageUtils.clearAll] Found ${keysToRemove.length} conversation keys to remove:`, keysToRemove);
      
      keysToRemove.forEach(key => {
        console.log(`🗑️ [ConversationStorageUtils.clearAll] Removing key: ${key}`);
        localStorage.removeItem(key)
      })
      
      console.log(`✅ [ConversationStorageUtils.clearAll] Successfully cleared ${keysToRemove.length} conversation keys`);
      return true
    } catch (error) {
      console.error('Failed to clear all conversations:', error)
      return false
    }
  },

  // Get total storage size
  getTotalSize(): number {
    try {
      let totalSize = 0
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const data = localStorage.getItem(key)
          if (data) {
            totalSize += new Blob([data]).size
          }
        }
      }
      
      return totalSize
    } catch (error) {
      return 0
    }
  }
} 