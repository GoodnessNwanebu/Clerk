import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface OSCETimerProps {
  onTimeUp?: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
  autoStart?: boolean;
  autoStartDelay?: number; // in milliseconds
}

interface TimeUpModalProps {
  isOpen: boolean;
  onFinish: () => void;
}

const TimeUpModal: React.FC<TimeUpModalProps> = ({ isOpen, onFinish }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 text-center max-w-sm w-full">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
          <Icon name="clock" size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Time's Up!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Your 5-minute history-taking session has ended. Click finish to proceed to the follow-up questions.
        </p>
        <button 
          onClick={onFinish}
          className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform"
        >
          Finish & Continue
        </button>
      </div>
    </div>
  );
};

export const OSCETimer: React.FC<OSCETimerProps> = ({ 
  onTimeUp, 
  onModalStateChange, 
  autoStart = false,
  autoStartDelay = 3000 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(300); // 5 minutes = 300 seconds
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-start timer after delay
  useEffect(() => {
    if (autoStart && !hasStarted) {
      autoStartTimeoutRef.current = setTimeout(() => {
        setIsRunning(true);
        setHasStarted(true);
        console.log('🕐 OSCE Timer auto-started after 3 seconds');
      }, autoStartDelay);
    }

    return () => {
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
      }
    };
  }, [autoStart, autoStartDelay, hasStarted]);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setShowTimeUpModal(true);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUp]);

  // Handle modal state changes
  useEffect(() => {
    onModalStateChange?.(showTimeUpModal);
  }, [showTimeUpModal, onModalStateChange]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    setIsRunning(false);
    setShowTimeUpModal(false);
    onTimeUp?.();
  };

  const handleManualFinish = () => {
    setIsRunning(false);
    setShowTimeUpModal(false);
    onTimeUp?.();
  };

  const isWarningTime = remainingSeconds <= 60; // Warning when 1 minute or less
  const isCriticalTime = remainingSeconds <= 30; // Critical when 30 seconds or less

  return (
    <>
      {/* Timer Display */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isRunning 
              ? (isCriticalTime ? 'bg-red-500 animate-pulse' : isWarningTime ? 'bg-yellow-500' : 'bg-green-500')
              : 'bg-slate-400'
          }`} />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {isRunning ? 'Recording' : hasStarted ? 'Paused' : 'Ready'}
          </span>
        </div>
        
        <div className={`text-lg font-mono font-bold ${
          isCriticalTime ? 'text-red-500 animate-pulse' : 
          isWarningTime ? 'text-yellow-600' : 
          'text-slate-800 dark:text-white'
        }`}>
          {formatTime(remainingSeconds)}
        </div>
        
        {!showTimeUpModal && (
          <button
            onClick={handleManualFinish}
            className="px-3 py-1.5 text-sm bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-lg hover:scale-105 transform transition-transform font-medium"
          >
            Finish
          </button>
        )}
      </div>

      {/* Time Up Modal */}
      <TimeUpModal 
        isOpen={showTimeUpModal} 
        onFinish={handleFinish} 
      />
    </>
  );
};
