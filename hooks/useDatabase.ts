import { useState, useCallback } from 'react'

interface User {
  id: string
  email: string
  country?: string
  createdAt: string
  updatedAt: string
}

interface Case {
  id: string
  diagnosis: string
  primaryInfo: string
  openingLine: string
  isPediatric: boolean
  difficultyLevel: string
  userId: string
  departmentId: string
  startedAt: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

interface DatabaseStats {
  totalCases: number
  completedCases: number
  completionRate: number
  departmentBreakdown: any[]
}

export function useDatabase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create or get user
  const createOrGetUser = useCallback(async (email: string, country?: string): Promise<User | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: { email, country }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create/get user')
      }

      const data = await response.json()
      return data.user
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new case
  const createCase = useCallback(async (caseData: {
    email: string
    country?: string
    diagnosis: string
    primaryInfo: string
    openingLine: string
    isPediatric: boolean
    difficultyLevel: string
    departmentId: string
    patientProfileId?: string
    pediatricProfileId?: string
  }): Promise<Case | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: caseData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create case')
      }

      const data = await response.json()
      return data.case
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get user's cases
  const getUserCases = useCallback(async (userId: string, limit = 20): Promise<Case[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/cases?userId=${userId}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user cases')
      }

      const data = await response.json()
      return data.cases || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Get specific case
  const getCase = useCallback(async (caseId: string): Promise<Case | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/cases?caseId=${caseId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch case')
      }

      const data = await response.json()
      return data.case
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Update case state
  const updateCase = useCallback(async (caseId: string, updates: Partial<{
    preliminaryDiagnosis: string
    examinationPlan: string
    investigationPlan: string
    finalDiagnosis: string
    managementPlan: string
  }>): Promise<Case | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          data: { caseId, updates }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update case')
      }

      const data = await response.json()
      return data.case
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Enhanced AI request with database integration
  const aiRequest = useCallback(async (requestData: {
    type: string
    payload: any
    userEmail?: string
    userCountry?: string
    caseId?: string
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error('AI request failed')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Batch save conversation to database
  const saveConversationBatch = useCallback(async (data: {
    userEmail: string
    userCountry?: string
    caseId: string
    messages: any[]
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cases/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveConversation',
          userEmail: data.userEmail,
          userCountry: data.userCountry,
          caseId: data.caseId,
          messages: data.messages
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save conversation batch')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Batch save case state to database
  const saveCaseStateBatch = useCallback(async (data: {
    userEmail: string
    userCountry?: string
    caseId: string
    caseState: any
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cases/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveCaseState',
          userEmail: data.userEmail,
          userCountry: data.userCountry,
          caseId: data.caseId,
          caseState: data.caseState
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save case state batch')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Batch save results to database
  const saveResultsBatch = useCallback(async (data: {
    userEmail: string
    userCountry?: string
    caseId: string
    examinationResults?: any[]
    investigationResults?: any[]
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cases/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveResults',
          userEmail: data.userEmail,
          userCountry: data.userCountry,
          caseId: data.caseId,
          examinationResults: data.examinationResults,
          investigationResults: data.investigationResults
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save results batch')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Batch save feedback to database
  const saveFeedbackBatch = useCallback(async (data: {
    userEmail: string
    userCountry?: string
    caseId: string
    feedback: any
    isDetailed?: boolean
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cases/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: data.isDetailed ? 'saveDetailedFeedback' : 'saveFeedback',
          userEmail: data.userEmail,
          userCountry: data.userCountry,
          caseId: data.caseId,
          feedback: data.feedback
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save feedback batch')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get user statistics
  const getUserStats = useCallback(async (userId: string): Promise<DatabaseStats | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/stats?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user stats')
      }

      const data = await response.json()
      return data.stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createOrGetUser,
    createCase,
    getUserCases,
    getCase,
    updateCase,
    aiRequest,
    saveConversationBatch,
    saveCaseStateBatch,
    saveResultsBatch,
    saveFeedbackBatch,
    getUserStats
  }
} 