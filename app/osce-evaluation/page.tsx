'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { OSCEEvaluation, OSCEEvaluationAPIResponse } from '../../types/osce';
import ReactMarkdown from 'react-markdown';
import { ConversationStorageUtils } from '../../lib/storage/localStorage';
import { clearOSCEQuestions } from '../../lib/ai/osce-utils';
import { invalidateOSCEAnswers } from '../../lib/cache/osce-answers-cache';

const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => (
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <div className="flex items-center space-x-3">
      <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div 
          className="bg-teal-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-900 dark:text-white w-12 text-right">
        {score}/100
      </span>
    </div>
  </div>
);

const OSCEEvaluationPage: React.FC = () => {
  const router = useRouter();
  const { caseState, resetCase, setNavigationEntryPoint } = useAppContext();
  
  const [evaluation, setEvaluation] = useState<OSCEEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    clinicalOpportunities: false,
    followupAnswers: false,
    clinicalPearls: false
  });

  useEffect(() => {
    const loadEvaluation = async (): Promise<void> => {
      if (!caseState.caseId) {
        console.error('❌ [OSCE Evaluation] No case ID available');
        router.push('/');
        return;
      }

      try {
        console.log('🔄 [OSCE Evaluation] Loading evaluation from localStorage...');
        
        // Check if evaluation is already stored in localStorage
        const storedEvaluation = localStorage.getItem(`osce-evaluation-${caseState.caseId}`);
        if (storedEvaluation) {
          const evalData = JSON.parse(storedEvaluation);
          setEvaluation(evalData);
          setIsLoading(false);
          console.log('✅ [OSCE Evaluation] Loaded from localStorage');
          return;
        }

        // If not in localStorage, we have a problem - evaluation should have been generated
        setError('Evaluation not found. Please try again.');
        setIsLoading(false);

      } catch (error) {
        console.error('❌ [OSCE Evaluation] Error loading evaluation:', error);
        setError('Failed to load evaluation. Please try again.');
        setIsLoading(false);
      }
    };

    loadEvaluation();
  }, [caseState.caseId, router]);

  const toggleSection = (section: 'clinicalOpportunities' | 'followupAnswers' | 'clinicalPearls'): void => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDone = async (): Promise<void> => {
    try {
      console.log('🏁 [OSCE Evaluation] Completing OSCE session');
      
      // Clear OSCE-specific data
      if (caseState.caseId) {
        clearOSCEQuestions(caseState.caseId);
        await invalidateOSCEAnswers(caseState.caseId);
        localStorage.removeItem(`osce-evaluation-${caseState.caseId}`);
      }

      // Deactivate session
      if (caseState.sessionId) {
        try {
          await fetch('/api/sessions/invalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: caseState.sessionId,
              caseId: caseState.caseId
            }),
            credentials: 'include',
          });
          console.log('✅ [OSCE Evaluation] Session deactivated');
        } catch (error) {
          console.error('❌ [OSCE Evaluation] Error deactivating session:', error);
        }
      }

      // Clear all case data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('clerkSmartConversation');
        localStorage.removeItem('clerkSmartCaseState');
        ConversationStorageUtils.clearAll();
      }

      resetCase();
      setNavigationEntryPoint('');
      router.push('/');
      console.log('✅ [OSCE Evaluation] Successfully completed and navigated home');
      
    } catch (error) {
      console.error('❌ [OSCE Evaluation] Error during completion:', error);
      // Still navigate home even if cleanup fails
      router.push('/');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your OSCE evaluation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Icon name="alert-circle" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Evaluation Not Available
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {error || 'We couldn\'t load your OSCE evaluation.'}
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="px-4 py-6 sm:px-6">
          <div className="text-left sm:text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              OSCE Evaluation
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-2">
              Final Diagnosis: <span className="font-semibold text-teal-600 dark:text-teal-400">{evaluation.diagnosis}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 sm:py-8 max-w-4xl mx-auto space-y-6">
        
        {/* Score Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/20 rounded-full flex items-center justify-center mr-4">
              <Icon name="award" className="text-teal-600 dark:text-teal-400" size={20}/>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Your OSCE Score: {Math.round(evaluation.scoreBreakdown.overallScore)}/100
            </h3>
          </div>
          
          <div className="space-y-4">
            <ScoreBar score={evaluation.scoreBreakdown.historyCoverage} label="History Coverage" />
            <ScoreBar score={evaluation.scoreBreakdown.relevanceOfQuestions} label="Relevance of Questions" />
            <ScoreBar score={evaluation.scoreBreakdown.clinicalReasoning} label="Clinical Reasoning" />
            <ScoreBar score={evaluation.scoreBreakdown.followupQuestions} label="Follow-up Questions" />
          </div>
        </div>

        {/* Rationale for Score */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center mb-4">
            <Icon name="message-square" className="text-blue-600 dark:text-blue-400 mr-3" size={20}/>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Rationale Behind Your Score
            </h3>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
            <ReactMarkdown>
              {evaluation.rationaleForScore}
            </ReactMarkdown>
          </div>
        </div>

        {/* Clinical Opportunities - Collapsible */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => toggleSection('clinicalOpportunities')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                <Icon name="alert-triangle" className="text-amber-600 dark:text-amber-400" size={20}/>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Clinical Opportunities
              </h3>
            </div>
            <Icon 
              name={expandedSections.clinicalOpportunities ? "chevron-up" : "chevron-down"} 
              className="text-slate-500 dark:text-slate-400" 
              size={24}
            />
          </button>
          
          {expandedSections.clinicalOpportunities && (
            <div className="px-6 pb-6 space-y-6">
              {/* Areas for Improvement */}
              {evaluation.clinicalOpportunities.areasForImprovement.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-base">
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-3">
                    {evaluation.clinicalOpportunities.areasForImprovement.map((point, index) => (
                      <li key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Icon name="x-circle" className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={16}/>
                          <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                            <ReactMarkdown>
                              {point}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Missed Opportunities */}
              {evaluation.clinicalOpportunities.missedOpportunities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-base">
                    Missed Opportunities
                  </h4>
                  <ul className="space-y-4">
                    {evaluation.clinicalOpportunities.missedOpportunities.map((opportunity, index) => (
                      <li key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-900 dark:text-white font-medium leading-relaxed">
                            <ReactMarkdown>
                              {opportunity.opportunity}
                            </ReactMarkdown>
                          </div>
                          <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            <ReactMarkdown>
                              {`**Clinical significance:** ${opportunity.clinicalSignificance}`}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Follow-up Questions & Answers - Collapsible */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => toggleSection('followupAnswers')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Icon name="help-circle" className="text-blue-600 dark:text-blue-400" size={20}/>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Follow-up Questions & Answers
              </h3>
            </div>
            <Icon 
              name={expandedSections.followupAnswers ? "chevron-up" : "chevron-down"} 
              className="text-slate-500 dark:text-slate-400" 
              size={24}
            />
          </button>
          
          {expandedSections.followupAnswers && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {evaluation.followupAnswers.map((item, index) => (
                  <div key={item.questionId} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <span className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-1 rounded text-sm font-medium flex-shrink-0">
                          Q{index + 1}
                        </span>
                        <p className="text-slate-900 dark:text-white font-medium">
                          {item.question}
                        </p>
                      </div>
                      <div className="flex items-start space-x-3 ml-6">
                        <Icon name="check-circle" className="text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" size={16}/>
                        <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                          <ReactMarkdown>
                            {item.correctAnswer}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Pearls - Collapsible */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => toggleSection('clinicalPearls')}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                <Icon name="lightbulb" className="text-emerald-600 dark:text-emerald-400" size={20}/>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Clinical Pearls
              </h3>
            </div>
            <Icon 
              name={expandedSections.clinicalPearls ? "chevron-up" : "chevron-down"} 
              className="text-slate-500 dark:text-slate-400" 
              size={24}
            />  
          </button>
          
          {expandedSections.clinicalPearls && (
            <div className="px-6 pb-6">
              <ul className="space-y-3">
                {evaluation.clinicalPearls.map((pearl, index) => (
                  <li key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Icon name="star" className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={16}/>
                      <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                        <ReactMarkdown>
                          {pearl}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Done Button */}
        <div className="pt-6">
          <button
            onClick={handleDone}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3 text-base"
          >
            <span>Done</span>
            <Icon name="check" size={20}/>
          </button>
        </div>
      </main>
    </div>
  );
};

export default OSCEEvaluationPage;
