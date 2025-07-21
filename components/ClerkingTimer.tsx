import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface ClerkingTimerProps {
  onTimeUp?: () => void;
}

interface TimeUpModalProps {
  isOpen: boolean;
  onFinish: () => void;
}

const TimeUpModal: React.FC<TimeUpModalProps> = ({ isOpen, onFinish }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-slate-900 dark:text-white text-center max-w-sm border border-slate-200 dark:border-slate-700">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
          <Icon name="clock" size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold mb-2">Time's Up!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Your allocated time for this patient interaction has ended.
        </p>
        <button 
          onClick={onFinish}
          className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform"
        >
          Finish Session
        </button>
      </div>
    </div>
  );
};

export const ClerkingTimer: React.FC<ClerkingTimerProps> = ({ onTimeUp }) => {
  const [isCountdown, setIsCountdown] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(300); // 5 minutes default
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (isCountdown) {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              setIsRunning(false);
              setShowTimeUpModal(true);
              onTimeUp?.();
              return 0;
            }
            return prev - 1;
          });
        } else {
          setElapsedSeconds(prev => prev + 1);
        }
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
  }, [isRunning, isCountdown, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (isCountdown) {
      setRemainingSeconds(countdownMinutes * 60);
    } else {
      setElapsedSeconds(0);
    }
  };

  const handleModeToggle = () => {
    setIsRunning(false);
    setIsCountdown(!isCountdown);
    setElapsedSeconds(0);
    setRemainingSeconds(countdownMinutes * 60);
  };

  const handleCountdownMinutesChange = (minutes: number) => {
    setCountdownMinutes(minutes);
    setRemainingSeconds(minutes * 60);
  };

  const handleFinishSession = () => {
    setShowTimeUpModal(false);
    // You can add navigation logic here if needed
  };

  const currentTime = isCountdown ? remainingSeconds : elapsedSeconds;
  const isWarningTime = isCountdown && remainingSeconds <= 60 && remainingSeconds > 0;

  return (
    <>
      <TimeUpModal isOpen={showTimeUpModal} onFinish={handleFinishSession} />
      
      <div className="relative">
        {/* Compact header-friendly view */}
        {!isExpanded && (
                      <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <Icon 
                name="clock" 
                size={14} 
                className={`${isWarningTime ? 'text-red-500 animate-pulse' : isRunning ? 'text-teal-500' : ''} sm:w-4 sm:h-4`} 
              />
              <span className={`font-mono text-xs sm:text-sm font-medium ${isWarningTime ? 'text-red-500 font-bold' : isRunning ? 'text-teal-600 dark:text-teal-400' : ''}`}>
                {formatTime(currentTime)}
              </span>
            </button>
        )}

        {/* Expanded dropdown */}
        {isExpanded && (
          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 min-w-64 sm:min-w-72 max-w-[calc(100vw-2rem)] z-50 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200">
                {isCountdown ? 'Countdown Timer' : 'Session Timer'}
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Icon name="x" size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Timer display */}
            <div className="text-center mb-3 sm:mb-4">
              <div className={`text-xl sm:text-2xl font-mono font-bold mb-1 ${
                isWarningTime ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-white'
              }`}>
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isCountdown ? 'Time remaining' : 'Time elapsed'}
              </div>
            </div>

            {/* Countdown minutes selector */}
            {isCountdown && !isRunning && (
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Set minutes:
                </label>
                <div className="flex space-x-1">
                  {[5, 10, 15, 20, 30].map(minutes => (
                    <button
                      key={minutes}
                      onClick={() => handleCountdownMinutesChange(minutes)}
                      className={`px-1.5 sm:px-2 py-1 text-xs rounded transition-colors ${
                        countdownMinutes === minutes
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex space-x-2 mb-3">
              <button
                onClick={handleToggleTimer}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-lg font-medium text-sm transition-all ${
                  isRunning
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:scale-105'
                }`}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={handleReset}
                className="px-2 sm:px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Icon name="rotate-ccw" size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Mode toggle */}
            <button
              onClick={handleModeToggle}
              className="w-full py-1.5 sm:py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors border-t border-slate-200 dark:border-slate-600 pt-2"
            >
              Switch to {isCountdown ? 'Stopwatch' : 'Countdown'} Mode
            </button>
          </div>
        )}
      </div>
    </>
  );
}; 