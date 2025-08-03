'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from './Icon'
import { SimpleSaveIndicator } from './BatchSaveIndicator'

interface FinishButtonProps {
  onFinish: () => Promise<void>
  disabled?: boolean
  className?: string
}

export const FinishButton: React.FC<FinishButtonProps> = ({
  onFinish,
  disabled = false,
  className = ""
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("Saving conversation...")

  const handleFinish = async () => {
    if (disabled || isSaving) return

    setIsSaving(true)
    setSaveMessage("Saving conversation...")

    try {
      await onFinish()
      setSaveMessage("Saving complete!")
      
      // Brief delay to show completion
      setTimeout(() => {
        setIsSaving(false)
      }, 500)
    } catch (error) {
      console.error('Error during finish:', error)
      setSaveMessage("Save failed - please try again")
      
      // Reset after showing error
      setTimeout(() => {
        setIsSaving(false)
      }, 2000)
    }
  }

  return (
    <>
      <button
        onClick={handleFinish}
        disabled={disabled || isSaving}
        className={`px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transform transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isSaving ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Saving...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Icon name="check-circle" size={16} />
            <span>Finish</span>
          </div>
        )}
      </button>

      <SimpleSaveIndicator 
        isVisible={isSaving} 
        message={saveMessage}
      />
    </>
  )
}

// Alternative version with more detailed save steps
interface DetailedFinishButtonProps {
  onFinish: (updateProgress: (step: string, stepNumber: number) => void) => Promise<void>
  disabled?: boolean
  className?: string
}

export const DetailedFinishButton: React.FC<DetailedFinishButtonProps> = ({
  onFinish,
  disabled = false,
  className = ""
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState("")
  const [currentStepNumber, setCurrentStepNumber] = useState(0)
  const [totalSteps, setTotalSteps] = useState(3)

  const updateProgress = (step: string, stepNumber: number) => {
    setCurrentStep(step)
    setCurrentStepNumber(stepNumber)
  }

  const handleFinish = async () => {
    if (disabled || isSaving) return

    setIsSaving(true)
    setCurrentStep("Preparing to save...")
    setCurrentStepNumber(0)

    try {
      await onFinish(updateProgress)
      
      // Show completion briefly
      setCurrentStep("Save complete!")
      setCurrentStepNumber(totalSteps)
      
      setTimeout(() => {
        setIsSaving(false)
      }, 1000)
    } catch (error) {
      console.error('Error during finish:', error)
      setCurrentStep("Save failed - please try again")
      
      setTimeout(() => {
        setIsSaving(false)
      }, 2000)
    }
  }

  return (
    <>
      <button
        onClick={handleFinish}
        disabled={disabled || isSaving}
        className={`px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transform transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isSaving ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Saving...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Icon name="check-circle" size={16} />
            <span>Finish</span>
          </div>
        )}
      </button>

      <SimpleSaveIndicator 
        isVisible={isSaving} 
        message={currentStep}
      />
    </>
  )
} 