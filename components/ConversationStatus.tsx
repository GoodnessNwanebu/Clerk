'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from './Icon'

interface ConversationStatusProps {
  messageCount: number
  lastSaved?: string
  isAutoSaving?: boolean
  showRecoveryStatus?: boolean
}

export const ConversationStatus: React.FC<ConversationStatusProps> = ({
  messageCount,
  lastSaved,
  isAutoSaving = true,
  showRecoveryStatus = false
}) => {
  const [showStatus, setShowStatus] = useState(false)

  // Show status briefly when message count changes
  useEffect(() => {
    setShowStatus(true)
    const timer = setTimeout(() => setShowStatus(false), 2000)
    return () => clearTimeout(timer)
  }, [messageCount])

  if (!showStatus && !showRecoveryStatus) return null

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 max-w-xs">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            {isAutoSaving ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ) : (
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {isAutoSaving ? 'Auto-saving' : 'Saving...'}
            </p>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {messageCount} message{messageCount !== 1 ? 's' : ''} saved locally
            </p>
            
            {lastSaved && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Recovery notification component
interface RecoveryNotificationProps {
  isVisible: boolean
  onRestore: () => void
  onDismiss: () => void
  conversationInfo: {
    messageCount: number
    lastUpdated: string
  }
}

export const RecoveryNotification: React.FC<RecoveryNotificationProps> = ({
  isVisible,
  onRestore,
  onDismiss,
  conversationInfo
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon name="refresh-cw" size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Conversation Found
            </h3>
            
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              We found an unsaved conversation with {conversationInfo.messageCount} messages from{' '}
              {new Date(conversationInfo.lastUpdated).toLocaleString()}.
            </p>
            
            <div className="flex space-x-2 mt-3">
              <button
                onClick={onRestore}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Restore
              </button>
              
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 bg-transparent text-blue-600 dark:text-blue-400 text-xs font-medium rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
} 