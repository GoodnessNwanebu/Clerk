import { useState, useEffect, useRef } from 'react';

// Safe browser check for Next.js
const isBrowser = typeof window !== 'undefined';
// Polyfill for browsers that might not have SpeechRecognition in the window scope
const SpeechRecognition = isBrowser ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isBrowser) return; // Only run on client side
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported by your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
        if (recognitionRef.current) { // only update if we are not manually stopping
            setIsListening(false);
        }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!isBrowser) return; // Only run on client side
    
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setError('Speech recognition could not start.');
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (!isBrowser) return; // Only run on client side
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    hasRecognitionSupport: isBrowser && !!SpeechRecognition,
  };
};
