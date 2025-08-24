'use client'

import React from 'react'
import { Icon } from './Icon'

interface BatchSaveIndicatorProps {
  isVisible: boolean
  currentStep: string
  totalSteps: number
  currentStepNumber: number
}

export const BatchSaveIndicator: React.FC<BatchSaveIndicatorProps> = ({
  isVisible,
  currentStep,
  totalSteps,
  currentStepNumber
}) => {
  if (!isVisible) return null

  const progress = (currentStepNumber / totalSteps) * 100

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Loading Icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Icon name="save" size={24} className="text-white animate-pulse" />
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Saving Your Progress
          </h3>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Current Step */}
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            {currentStep}
          </p>
          
          {/* Progress Text */}
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Step {currentStepNumber} of {totalSteps}
          </p>
        </div>
      </div>
    </div>
  )
}

// Simplified version for single operations
export const SimpleSaveIndicator: React.FC<{ isVisible: boolean; message?: string }> = ({
  isVisible,
  message = "Saving..."
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Icon name="save" size={24} className="text-white animate-pulse" />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {message}
          </h3>
          
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
          </div>
        </div>
      </div>
    </div>
  )
} 