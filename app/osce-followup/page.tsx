'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { getOSCEQuestions, getOSCEGenerationStatus, areOSCEQuestionsReady } from '../../lib/ai/osce-utils';
import { OSCEQuestion, OSCEGenerationStatus, OSCEStudentResponse, OSCEEvaluationAPIResponse } from '../../types/osce';

interface QuestionResponse {
  questionId: string;
  answer: string;
}

const OSCEFollowupPage: React.FC = () => {
  const router = useRouter();
  const { caseState } = useAppContext();
  
  // Strongly typed state
  const [questions, setQuestions] = useState<OSCEQuestion[]>([]);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [generationStatus, setGenerationStatus] = useState<OSCEGenerationStatus | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize questions and responses
  useEffect(() => {
    const initializeQuestions = (): void => {
      if (!caseState.caseId) {
        console.error('❌ [OSCE Followup] No case ID available');
        router.push('/');
        return;
      }

      console.log('🔍 [OSCE Followup] Checking for questions, case ID:', caseState.caseId);
      
      // Check localStorage for questions
      const questionsReady = areOSCEQuestionsReady(caseState.caseId);
      console.log('📋 [OSCE Followup] Questions ready check:', questionsReady);
      
      if (questionsReady) {
        const osceQuestions = getOSCEQuestions(caseState.caseId);
        console.log('📋 [OSCE Followup] Retrieved questions:', {
          questionsCount: osceQuestions?.length || 0,
          hasQuestions: !!osceQuestions
        });
        
        if (osceQuestions) {
          setQuestions(osceQuestions);
          // Initialize empty responses
          const initialResponses: QuestionResponse[] = osceQuestions.map(q => ({
            questionId: q.id,
            answer: ''
          }));
          setResponses(initialResponses);
          setIsLoading(false);
          console.log('✅ [OSCE Followup] Questions loaded successfully, count:', osceQuestions.length);
        }
      } else {
        // Questions not ready, check status
        const status = getOSCEGenerationStatus(caseState.caseId);
        console.log('⏳ [OSCE Followup] Questions not ready, status:', status);
        setGenerationStatus(status);
        
        if (status?.status === 'failed') {
          console.error('❌ [OSCE Followup] Question generation failed:', status.lastError);
          // Could show error state or redirect
        }
      }
    };

    initializeQuestions();

    // Poll for questions if they're not ready
    if (!areOSCEQuestionsReady(caseState.caseId || '')) {
      console.log('⏳ [OSCE Followup] Starting polling for questions...');
      const pollInterval = setInterval(() => {
        console.log('🔄 [OSCE Followup] Polling for questions...');
        if (caseState.caseId && areOSCEQuestionsReady(caseState.caseId)) {
          console.log('✅ [OSCE Followup] Questions became ready during polling');
          initializeQuestions();
          clearInterval(pollInterval);
        } else if (caseState.caseId) {
          const status = getOSCEGenerationStatus(caseState.caseId);
          console.log('⏳ [OSCE Followup] Still waiting, status:', status);
          setGenerationStatus(status);
        }
      }, 2000);

      return () => {
        console.log('🛑 [OSCE Followup] Stopping polling');
        clearInterval(pollInterval);
      };
    }
  }, [caseState.caseId, router]);

  const handleAnswerChange = (questionId: string, answer: string): void => {
    setResponses(prev => prev.map(response => 
      response.questionId === questionId 
        ? { ...response, answer }
        : response
    ));
  };

  const handleNextQuestion = (): void => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSkipQuestion = (): void => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleMicClick = (): void => {
    // TODO: Implement microphone functionality
    console.log('🎤 [OSCE Followup] Microphone clicked for question:', currentQuestion.id);
  };

  const handleSubmitAnswers = async (): Promise<void> => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Convert to strongly typed student responses
      const studentResponses: OSCEStudentResponse[] = responses.map(response => ({
        questionId: response.questionId,
        studentAnswer: response.answer
      }));

      console.log('📝 [OSCE Followup] Submitting', studentResponses.length, 'responses for evaluation');
      
      // Send to OSCE evaluation endpoint
      const response = await fetch('/api/ai/osce-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentResponses,
          caseState
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Evaluation request failed: ${response.status}`);
      }

      const evaluationData: OSCEEvaluationAPIResponse = await response.json();
      
      if (!evaluationData.success || !evaluationData.evaluation) {
        throw new Error('Invalid evaluation response');
      }

      // Store evaluation in localStorage for the evaluation page
      if (caseState.caseId) {
        localStorage.setItem(`osce-evaluation-${caseState.caseId}`, JSON.stringify(evaluationData.evaluation));
        console.log('✅ [OSCE Followup] Evaluation stored in localStorage');
      }

      // Navigate to OSCE evaluation page
      router.push('/osce-evaluation');
      
    } catch (error) {
      console.error('❌ [OSCE Followup] Error submitting answers:', error);
      // Could show error state here
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnswerComplete = (questionId: string): boolean => {
    const response = responses.find(r => r.questionId === questionId);
    return Boolean(response?.answer.trim());
  };

  const getCompletedCount = (): number => {
    return responses.filter(r => r.answer.trim()).length;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <Icon name="loader-2" size={64} className="animate-spin text-teal-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Give it a minute, we are generating your questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {generationStatus?.status === 'retrying' 
              ? `Generating questions (attempt ${generationStatus.attempts}/${generationStatus.maxAttempts})...`
              : 'Preparing your OSCE follow-up questions...'
            }
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Icon name="alert-circle" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Questions Not Available
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            We couldn't load your follow-up questions. Please try again.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentResponse = responses.find(r => r.questionId === currentQuestion.id);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasCurrentAnswer = Boolean(currentResponse?.answer.trim());
  const allQuestionsAnswered = responses.every(r => r.answer.trim());

  return (
    <div 
      className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300 flex flex-col"
      style={{ height: '100vh', maxHeight: '100vh' }}
    >
      {/* Top Section - Question Counter & Progress */}
      <div className="flex-shrink-0 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {currentQuestionIndex + 1}/10
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Section */}
      <main className="flex-1 px-4 sm:px-6 pb-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Question */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer input with microphone */}
          <div className="relative">
            <textarea
              value={currentResponse?.answer || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Enter your answer here..."
              rows={8}
              className="w-full p-4 pr-16 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none text-base"
            />
            <button
              onClick={handleMicClick}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              aria-label="Voice input"
            >
              <Icon name="mic" size={20} />
            </button>
          </div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="flex-shrink-0 p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Previous Button */}
          {currentQuestionIndex > 0 ? (
            <button
              onClick={handlePreviousQuestion}
              className="flex items-center space-x-2 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Icon name="chevron-left" size={20} />
              <span>Previous</span>
            </button>
          ) : (
            <div></div> // Empty space to maintain layout
          )}

          {/* Next/Skip/Submit Button */}
          <div className="flex space-x-3">
            {!isLastQuestion ? (
              <button
                onClick={hasCurrentAnswer ? handleNextQuestion : handleSkipQuestion}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  hasCurrentAnswer 
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <span>{hasCurrentAnswer ? 'Next' : 'Skip'}</span>
                <Icon name="chevron-right" size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmitAnswers}
                disabled={!allQuestionsAnswered || isSubmitting}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  allQuestionsAnswered && !isSubmitting
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="loader-2" size={20} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Icon name="check" size={20} />
                    <span>Submit Answers</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OSCEFollowupPage;
