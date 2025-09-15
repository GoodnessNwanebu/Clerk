'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '../../../../components/Icon';
import { OSCEEvaluation } from '../../../../types/osce';

interface EvaluationPageProps {}

const EvaluationPage: React.FC<EvaluationPageProps> = () => {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [evaluation, setEvaluation] = useState<OSCEEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load evaluation on component mount
  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const response = await fetch(`/api/osce/evaluation?sessionId=${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load evaluation');
        }

        setEvaluation(data.evaluation);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading evaluation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load evaluation');
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadEvaluation();
    }
  }, [sessionId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Generating your evaluation...</p>
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

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">No evaluation found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/osce')}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon name="arrow-left" size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">OSCE Results</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Section 1: Scoring */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Overall Score</h2>
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreBgColor(evaluation.scores.overallScore)} ${getScoreColor(evaluation.scores.overallScore)}`}>
                {evaluation.scores.overallScore}
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">out of 100</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">History Taking Structure</span>
                <span className={`font-semibold ${getScoreColor(evaluation.scores.historyTakingStructure)}`}>
                  {evaluation.scores.historyTakingStructure}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Question Relevance</span>
                <span className={`font-semibold ${getScoreColor(evaluation.scores.questionRelevance)}`}>
                  {evaluation.scores.questionRelevance}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">History Coverage</span>
                <span className={`font-semibold ${getScoreColor(evaluation.scores.historyCoverage)}`}>
                  {evaluation.scores.historyCoverage}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Diagnostic Accuracy</span>
                <span className={`font-semibold ${getScoreColor(evaluation.scores.diagnosticAccuracy)}`}>
                  {evaluation.scores.diagnosticAccuracy}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Follow-up Questions</span>
                <span className={`font-semibold ${getScoreColor(evaluation.scores.followUpQuestions)}`}>
                  {evaluation.scores.followUpQuestions}/100
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: History Feedback */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon name="message-circle" size={20} className="text-blue-500" />
              History Taking Feedback
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
              Key questions you should have asked to gather important aspects of this patient's history:
            </p>
            <div className="space-y-3">
              {evaluation.feedback.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <Icon name="check-circle" size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{strength}</span>
                </div>
              ))}
              {evaluation.feedback.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Icon name="alert-circle" size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{weakness}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Follow-up Answers */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Icon name="book-open" size={20} className="text-purple-500" />
              Follow-up Question Answers
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
              Review your answers and the correct responses:
            </p>
            <div className="space-y-4">
              {evaluation.feedback.followUpCorrections.map((correction, index) => (
                <div key={index} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="mb-3">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Question {index + 1}:</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{correction.questionId}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">Correct Answer:</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm">{correction.correctAnswer}</p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Explanation:</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm">{correction.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Done Button */}
          <div className="pt-6">
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transform transition-transform"
            >
              Done
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EvaluationPage;
