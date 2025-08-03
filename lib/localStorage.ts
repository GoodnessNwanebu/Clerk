import { Message, CaseState } from '../types'

const STORAGE_PREFIX = 'clerksmart_case_'

export interface LocalStorageCase {
  caseId: string
  conversation: Message[]
  caseState: Partial<CaseState>
  lastUpdated: string
}

export class ConversationStorage {
  private caseId: string
  private storageKey: string

  constructor(caseId: string) {
    this.caseId = caseId
    this.storageKey = `${STORAGE_PREFIX}${caseId}`
  }

  // Save conversation to localStorage
  saveConversation(messages: Message[], caseState?: Partial<CaseState>): boolean {
    try {
      const data: LocalStorageCase = {
        caseId: this.caseId,
        conversation: messages,
        caseState: caseState || {},
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Failed to save conversation to localStorage:', error)
      return false
    }
  }

  // Load conversation from localStorage
  loadConversation(): LocalStorageCase | null {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (!data) return null
      
      const parsed = JSON.parse(data) as LocalStorageCase
      
      // Validate the data structure
      if (!parsed.caseId || !Array.isArray(parsed.conversation)) {
        console.warn('Invalid conversation data in localStorage')
        return null
      }
      
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

  // Update case state in localStorage
  updateCaseState(caseState: Partial<CaseState>): boolean {
    try {
      const existing = this.loadConversation()
      if (existing) {
        existing.caseState = { ...existing.caseState, ...caseState }
        existing.lastUpdated = new Date().toISOString()
        localStorage.setItem(this.storageKey, JSON.stringify(existing))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update case state in localStorage:', error)
      return false
    }
  }

  // Clear conversation from localStorage
  clear(): boolean {
    try {
      localStorage.removeItem(this.storageKey)
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
      const keysToRemove: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
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