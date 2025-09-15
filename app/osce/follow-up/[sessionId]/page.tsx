'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '../../../../components/Icon';
import { OSCEFollowUpQuestion } from '../../../../types/osce';

interface FollowUpQuestionsPageProps {}

const FollowUpQuestionsPage: React.FC<FollowUpQuestionsPageProps> = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [questions, setQuestions] = useState<OSCEFollowUpQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch(`/api/osce/followup?sessionId=${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load questions');
        }

        setQuestions(data.questions);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadQuestions();
    }
  }, [sessionId]);

  // Load existing answer when question changes
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      setCurrentAnswer(answers[currentQuestion.id] || '');
    }
  }, [currentQuestionIndex, questions, answers]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [currentAnswer]);

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
  };

  const saveAnswer = async (questionId: string, answer: string) => {
    try {
      const response = await fetch('/api/osce/followup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          questionId,
          answer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save answer');
      }

      // Update local state
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer,
      }));
    } catch (err) {
      console.error('Error saving answer:', err);
      // Don't show error to user for auto-save failures
    }
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && currentAnswer.trim()) {
      await saveAnswer(currentQuestion.id, currentAnswer.trim());
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSkip = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && currentAnswer.trim()) {
      // If there's text, clear it and save empty answer
      setCurrentAnswer('');
      await saveAnswer(currentQuestion.id, '');
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && currentAnswer.trim()) {
      await saveAnswer(currentQuestion.id, currentAnswer.trim());
    }

    setIsSubmitting(true);
    
    try {
      // Trigger evaluation generation
      const response = await fetch('/api/ai/evaluate-osce-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate evaluation');
      }

      // Navigate to evaluation page
      router.push(`/osce/evaluation/${sessionId}`);
    } catch (err) {
      console.error('Error submitting:', err);
      setError('Failed to submit answers');
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswer = currentAnswer.trim().length > 0;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Icon name="alert-circle" size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/osce')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transform transition-transform"
          >
            Back to OSCE
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">No questions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="h-1 bg-slate-200 dark:bg-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Question */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Text Area */}
          <div className="mb-8">
            <textarea
              ref={textareaRef}
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-400 transition-all duration-200"
              style={{
                minHeight: '120px',
                lineHeight: '1.6',
              }}
            />
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Back Button */}
            {currentQuestionIndex > 0 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            <div className="flex gap-3">
              {/* Skip Button - only show if no answer and not last question */}
              {!hasAnswer && !isLastQuestion && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Skip
                </button>
              )}

              {/* Next Button - only for non-last questions with answer */}
              {hasAnswer && !isLastQuestion && (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transform transition-all duration-200"
                >
                  Next
                </button>
              )}

              {/* Submit Button - always show on last question */}
              {isLastQuestion && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
                    hasAnswer
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:scale-105 transform'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 opacity-60 cursor-not-allowed'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FollowUpQuestionsPage;
