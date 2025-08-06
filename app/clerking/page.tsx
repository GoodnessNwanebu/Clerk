'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppContext } from '../../context/AppContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { getPatientResponse } from '../../services/geminiService';
import { Icon } from '../../components/Icon';
import { ClerkingTimer } from '../../components/ClerkingTimer';
import { Message } from '../../types';
import { getDepartmentConfig } from '../../lib/department-utils';

const PermissionModal: React.FC<{ onAllow: () => void; onDeny: () => void }> = ({ onAllow, onDeny }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-slate-900 dark:text-white text-center max-w-sm">
            <Icon name="mic" size={40} className="mx-auto text-teal-400 mb-4"/>
            <h2 className="text-xl font-bold mb-2">Microphone Access</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">ClerkSmart needs access to your microphone to enable voice conversations with the patient.</p>
            <div className="flex space-x-4">
                <button onClick={onDeny} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Deny</button>
                <button onClick={onAllow} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform">Allow</button>
            </div>
        </div>
    </div>
);

const ClerkingScreen: React.FC = () => {
  const router = useRouter();
  const [isTimeUpModalOpen, setIsTimeUpModalOpen] = useState(false);
  const { caseState, addMessage, userCountry, saveConversationToDatabase, savePatientInfoToDatabase, navigationEntryPoint } = useAppContext();
  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport, error: speechError } = useSpeechRecognition();
  
  // Client-side safe function to get department config
  const getDepartmentAvatar = (departmentName: string) => {
    if (typeof window === 'undefined') return '/avatars/default.svg';
    return getDepartmentConfig(departmentName)?.avatar || '/avatars/default.svg';
  };
  
  const [isPatientThinking, setIsPatientThinking] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);






  // Auto-resize textarea function
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max height 120px
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Handle scroll for sticky header and scroll-to-bottom button
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 50);
      
      // Check if user has scrolled up from bottom (threshold of 100px from bottom)
      const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      setShowScrollToBottom(!isNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-resize textarea when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText, adjustTextareaHeight]);



  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // Check if we have required case data before rendering
  useEffect(() => {
    if (!caseState.department || !caseState.caseDetails) {
      router.push('/departments');
    }
  }, [caseState.department, caseState.caseDetails, router]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [caseState.messages, isListening, isPatientThinking, inputText]);
  
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !caseState.caseDetails) return;

    setApiError(null);
    const studentMessage: Message = { sender: 'student', text, timestamp: new Date().toISOString() };
    addMessage(studentMessage);
    setInputText("");
    
    setIsPatientThinking(true);
    
    // The history sent to the API includes the new student message
    const updatedHistory = [...caseState.messages, studentMessage];

    try {
        const response = await getPatientResponse(updatedHistory, caseState.caseDetails, userCountry || undefined);
        
        // The API now always returns a messages array format
        if (response.messages && Array.isArray(response.messages)) {
            response.messages.forEach(msg => {
                const message: Message = {
                    sender: msg.sender,
                    text: msg.response,
                    timestamp: new Date().toISOString(),
                    speakerLabel: msg.speakerLabel
                };
                addMessage(message);
            });
        } else {
            throw new Error("Invalid response format from patient response API");
        }
    } catch (error) {
        console.error(error);
        let errorText = 'Sorry, there was a connection issue.';
        if (error instanceof Error) {
            errorText = error.message.startsWith('QUOTA_EXCEEDED') ? error.message.split(': ')[1] : error.message;
        }
        setApiError(errorText);
        const errorMessage: Message = { sender: 'system', text: `Error: ${errorText}`, timestamp: new Date().toISOString() };
        addMessage(errorMessage);
    } finally {
        setIsPatientThinking(false);
    }
  }, [addMessage, caseState.messages, caseState.caseDetails, userCountry]);

  // Effect to handle sending transcript from speech recognition
  useEffect(() => {
    if (!isListening && transcript.trim()) {
        handleSendMessage(transcript);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);


  const handleMicClick = async () => {
    if (isListening) {
      stopListening();
      return;
    }
    try {
      // Check for permission first
      if (typeof window !== 'undefined' && navigator?.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'prompt') {
          setShowPermissionModal(true);
          return;
        }
        if (permissionStatus.state === 'denied') {
          alert("Microphone access was denied. Please enable it in your browser settings.");
          return;
        }
      }
      startListening();
    } catch (error) {
      console.error("Error checking mic permissions:", error);
      // Fallback for browsers that don't support permissions.query
      handlePermissionAllow();
    }
  };

  const handlePermissionAllow = () => {
      setShowPermissionModal(false);
      if (typeof window !== 'undefined' && navigator?.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => startListening())
          .catch(() => alert("Microphone access is required. Please enable it in your browser settings."));
      }
  };
  
  const handlePermissionDeny = () => {
      setShowPermissionModal(false);
      alert("Microphone access is required for voice interaction.");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(inputText);
    }
  }

  // Early return after all hooks have been called
  if (!caseState.department || !caseState.caseDetails) {
    return null;
  }

  const handleTimeUp = () => {
    // Optional: Add any logic when timer expires, such as auto-navigation to summary
    console.log('Time is up for this patient session');
  };

  const handleModalStateChange = (isOpen: boolean) => {
    setIsTimeUpModalOpen(isOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      {showPermissionModal && <PermissionModal onAllow={handlePermissionAllow} onDeny={handlePermissionDeny} />}
      
      <header className={`fixed top-0 left-0 right-0 z-10 border-b p-4 transition-all duration-300 ${
        isHeaderSticky 
          ? 'bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-lg' 
          : 'bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50'
      }`} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)'}}>
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <button onClick={() => router.push(navigationEntryPoint || '/departments')} className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-white flex-shrink-0">
            <Icon name="arrow-left" size={20} className="sm:w-6 sm:h-6" />
          </button>
          <div className="text-center flex-shrink-0">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
              {caseState.department.name.length > 15 
                ? `${caseState.department.name.substring(0, 15)}...` 
                : caseState.department.name
              }
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Patient Clerking</p>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6 flex-shrink-0">
            <ClerkingTimer onTimeUp={handleTimeUp} onModalStateChange={handleModalStateChange} />
            <button 
              onClick={async () => {
                // Save conversation and patient info to database in background
                await Promise.all([
                  saveConversationToDatabase(),
                  savePatientInfoToDatabase()
                ]);
                // Navigate immediately (user doesn't see the save)
                router.push('/summary');
              }} 
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transform transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Finish
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-28 pb-40 overflow-y-auto" ref={mainRef}>
        <div className="flex flex-col items-center mb-8 px-4">
            <div className="relative">
                <Image 
                  src={caseState.department ? getDepartmentAvatar(caseState.department.name) : '/avatars/default.svg'} 
                  alt="Patient Avatar" 
                  width={96} 
                  height={96}
                  className="rounded-full border-4 border-slate-200 dark:border-slate-700" 
                />
                {(isListening || isPatientThinking) && <div className="absolute inset-0 rounded-full border-2 border-teal-400 animate-pulse"></div>}
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{isPatientThinking ? 'Patient is thinking...' : isListening ? 'Listening...' : 'Ready to talk'}</p>
        </div>
        
        <div className="space-y-4 px-4 max-w-4xl mx-auto">
          {caseState.messages.map((msg: Message, index: number) => {
            // Check if this is the opening line (first system message)
            const isOpeningLine = index === 0 && msg.sender === 'system';
            const isPediatricMessage = (msg.sender === 'patient' || msg.sender === 'parent') && msg.speakerLabel;
            
            return (
              <div key={index} className={`flex ${
                msg.sender === 'student' ? 'justify-end' : 
                msg.sender === 'patient' || msg.sender === 'parent' ? 'justify-start' :
                isOpeningLine ? 'justify-center' : 'justify-start'
              }`}>
                <div className="flex flex-col">
                  {/* Speaker label for pediatric cases */}
                  {isPediatricMessage && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">
                      {msg.speakerLabel}
                    </div>
                  )}
                <div className={`p-3 rounded-2xl whitespace-pre-wrap ${
                  msg.sender === 'student' ? 'max-w-xs md:max-w-md bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-br-lg' :
                    msg.sender === 'patient' || msg.sender === 'parent' ? `max-w-xs md:max-w-md text-slate-800 dark:text-white rounded-bl-lg ${
                      msg.sender === 'parent' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-200 dark:bg-slate-700'
                    }` :
                  isOpeningLine ? 'max-w-lg bg-transparent text-slate-500 dark:text-slate-400 text-center text-base' :
                  'bg-transparent text-slate-500 dark:text-slate-400 text-center w-full text-sm'
                }`}>
                  {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          {isListening && (
            <div className="flex justify-end">
              <div className="max-w-xs md:max-w-md p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-br-lg">
                {transcript || '...'}
              </div>
            </div>
          )}
           {isPatientThinking && (
             <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 rounded-bl-lg">
                 <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                 </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Floating Scroll to Bottom Button */}
        <button
          onClick={scrollToBottom}
          className={`fixed bottom-32 left-1/2 transform -translate-x-1/2 z-20 w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 ${
            showScrollToBottom 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
          }`}
          aria-label="Scroll to bottom"
          style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
        >
          <Icon name="arrow-down" size={20} />
        </button>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-100 dark:bg-slate-800 z-10 border-t border-slate-200 dark:border-slate-700 p-4 pb-8 transition-colors duration-300" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)'}}>
        <div className="flex items-center max-w-4xl mx-auto gap-3">
            <div 
                className="flex-grow relative"
            >
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={e => {
                        setInputText(e.target.value);
                    }}
                    onFocus={() => setIsTextareaFocused(true)}
                    onBlur={() => setIsTextareaFocused(false)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={isTimeUpModalOpen ? "Session ended - timer expired" : "Type your message..."}
                    rows={1}
                    autoComplete="off"
                    autoCapitalize="sentences"
                    autoCorrect="on"
                    spellCheck="true"
                    inputMode="text"
                    enterKeyHint="send"
                    readOnly={isTimeUpModalOpen}
                    tabIndex={0}
                    className={`w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 resize-none outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 ${isTimeUpModalOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{
                        minHeight: '48px',
                        maxHeight: '120px',
                        lineHeight: '1.5',
                        cursor: isTimeUpModalOpen ? 'not-allowed' : 'text',
                        overflow: 'hidden'
                    }}
                />
            </div>
            <div className="flex-shrink-0 flex items-center">
                <button
                    onClick={inputText.trim() ? () => handleSendMessage(inputText) : handleMicClick}
                    disabled={!hasRecognitionSupport || isPatientThinking || isTimeUpModalOpen}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-300 shadow-lg
                    ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700'}
                    ${(isPatientThinking || isTimeUpModalOpen) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:shadow-xl active:scale-95'}
                    `}
                >
                    {inputText.trim() ? <Icon name="send" size={20} /> : <Icon name={isListening ? 'mic-off' : 'mic'} size={20} />}
                </button>
            </div>
        </div>
        {!hasRecognitionSupport && <p className="text-red-400 text-xs text-center mt-2">Voice input not supported on this browser.</p>}
        {(speechError || apiError) && <p className="text-red-400 text-xs text-center mt-2 max-w-xs mx-auto">{speechError || apiError}</p>}
      </footer>
    </div>
  );
};

export default ClerkingScreen; 