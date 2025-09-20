import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface SideTimerProps {
  onTimeUp?: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
  onFinish?: () => void;
  showOSCEToggle?: boolean;
  osceMode?: boolean;
  onOSCEToggle?: (enabled: boolean) => void;
}

interface OSCEInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TimeUpModalProps {
  isOpen: boolean;
  onFinish: () => void;
}

const OSCEInfoModal: React.FC<OSCEInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Icon name="info" size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">OSCE Mode</h2>
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-left space-y-2">
            <p>• Clerking is timed with a 5-minute countdown</p>
            <p>• Timer starts immediately when case is created</p>
            <p>• Focus on obtaining maximum history within time limit</p>
            <p>• Followed by 10 follow-up questions after summary</p>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const TimeUpModal: React.FC<TimeUpModalProps> = ({ isOpen, onFinish }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Icon name="clock" size={24} className="text-white" />
          </div>
          <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Time's Up!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Your allocated time for this patient interaction has ended.
          </p>
          <button 
            onClick={onFinish}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform"
          >
            Finish Session
          </button>
        </div>
      </div>
    </div>
  );
};

export const SideTimer: React.FC<SideTimerProps> = ({ onTimeUp, onModalStateChange, onFinish, showOSCEToggle = false, osceMode = false, onOSCEToggle }) => {
  const [isCountdown, setIsCountdown] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(300); // 5 minutes default
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOSCEInfoModal, setShowOSCEInfoModal] = useState(false);
  
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

  // Handle modal state changes
  useEffect(() => {
    onModalStateChange?.(showTimeUpModal || showSettingsModal || showOSCEInfoModal);
  }, [showTimeUpModal, showSettingsModal, showOSCEInfoModal, onModalStateChange]);

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
    onModalStateChange?.(false);
    onFinish?.();
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
  };

  const currentTime = isCountdown ? remainingSeconds : elapsedSeconds;
  const isWarningTime = isCountdown && remainingSeconds <= 60 && remainingSeconds > 0;

  return (
    <>
      <OSCEInfoModal isOpen={showOSCEInfoModal} onClose={() => setShowOSCEInfoModal(false)} />
      <TimeUpModal isOpen={showTimeUpModal} onFinish={handleFinishSession} />
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 z-50">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {isCountdown ? 'Countdown Timer' : 'Session Timer'}
              </h3>
              <button
                onClick={handleCloseSettings}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            {/* Timer display */}
            <div className="text-center mb-4">
              <div className={`text-3xl font-mono font-bold mb-2 ${
                isWarningTime ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-white'
              }`}>
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {isCountdown ? 'Time remaining' : 'Time elapsed'}
              </div>
            </div>

            {/* Countdown minutes selector */}
            {isCountdown && !isRunning && (
              <div className="mb-4">
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Set minutes:
                </label>
                <div className="flex space-x-2">
                  {[5, 10, 15, 20, 30].map(minutes => (
                    <button
                      key={minutes}
                      onClick={() => handleCountdownMinutesChange(minutes)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
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

            {/* OSCE Mode Toggle */}
            {showOSCEToggle && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">OSCE Mode</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOSCEInfoModal(true);
                      }}
                      className="w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-500 flex items-center justify-center text-white text-xs font-bold hover:bg-slate-500 dark:hover:bg-slate-400 transition-colors"
                    >
                      <Icon name="info" size={10} />
                    </button>
                  </div>
                  <button
                    onClick={() => onOSCEToggle?.(!osceMode)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      osceMode ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      osceMode ? 'transform translate-x-5' : ''
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Practice conditions in exam-style stations
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={handleToggleTimer}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  isRunning
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:scale-105'
                }`}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Icon name="rotate-ccw" size={18} />
              </button>
            </div>

            {/* Mode toggle */}
            <button
              onClick={handleModeToggle}
              className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors border-t border-slate-200 dark:border-slate-600 pt-3"
            >
              Switch to {isCountdown ? 'Stopwatch' : 'Countdown'} Mode
            </button>
          </div>
        </div>
      )}

      {/* Side Timer Bar */}
      <div 
        className={`fixed right-0 top-1/2 transform -translate-y-1/2 z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'translate-x-16' : 'translate-x-0'
        }`}
        style={{
          // Position for comfortable thumb area on mobile and desktop
          marginTop: '-2rem' // Slight adjustment for better positioning
        }}
      >
        <div className="relative">
          {/* Collapse/Expand Arrow */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 ${
              isCollapsed ? '-translate-x-8' : '-translate-x-3'
            } w-6 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-300 shadow-lg`}
          >
            <Icon 
              name={isCollapsed ? "chevron-left" : "chevron-right"} 
              size={16}
            />
          </button>

          {/* Timer Bar or OSCE Toggle */}
          <div 
            className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l-xl shadow-lg transition-all duration-300 ${
              showOSCEToggle ? 'cursor-default' : 'cursor-pointer hover:shadow-xl'
            } ${isCollapsed ? 'w-16' : showOSCEToggle ? 'w-32' : 'w-24'}`}
            onClick={showOSCEToggle ? undefined : handleOpenSettings}
          >
            <div className="px-3 py-4">
              {showOSCEToggle ? (
                // OSCE Toggle UI
                <div className="text-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">OSCE</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOSCEInfoModal(true);
                        }}
                        className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 flex items-center justify-center text-white hover:bg-slate-500 dark:hover:bg-slate-400 transition-colors"
                      >
                        <Icon name="info" size={8} />
                      </button>
                    </div>
                    <button
                      onClick={() => onOSCEToggle?.(!osceMode)}
                      className={`relative w-8 h-4 rounded-full transition-all duration-300 ease-in-out ${
                        osceMode ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ease-in-out ${
                        osceMode ? 'transform translate-x-4' : ''
                      }`} />
                    </button>
                  </div>
                </div>
              ) : isCollapsed ? (
                // Collapsed state - vertical time display
                <div className="text-center">
                  <div className={`text-sm font-bold font-mono leading-tight ${
                    isWarningTime ? 'text-red-500 animate-pulse' : 
                    isRunning ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {formatTime(currentTime).split(':').map((part, index) => (
                      <div key={index}>{part}</div>
                    ))}
                  </div>
                </div>
              ) : (
                // Expanded state - horizontal time display
                <div className="text-center">
                  <div className={`text-lg font-bold font-mono ${
                    isWarningTime ? 'text-red-500 animate-pulse' : 
                    isRunning ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isCountdown ? 'remaining' : 'elapsed'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

