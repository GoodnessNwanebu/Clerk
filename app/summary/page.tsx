'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { getInvestigationResults, getExaminationResults, getComprehensiveCaseFeedback } from '../../lib/ai/geminiService';
import { Icon } from '../../components/Icon';
import { InvestigationResults } from '../../components/InvestigationResults';
import { ExaminationResults } from '../../components/ExaminationResults';
import { InvestigationResult, ExaminationResult, ComprehensiveFeedback } from '../../types';

const ProgressIndicator: React.FC<{ step: number }> = ({ step }) => (
    <div className="flex items-center justify-center space-x-4 my-8">
        <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step >= 1 ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-200'}`}>1</div>
            <span className={`font-semibold ${step >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Assessment</span>
        </div>
        <div className={`h-0.5 flex-grow ${step > 1 ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
        <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step >= 2 ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-200'}`}>2</div>
            <span className={`font-semibold ${step >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Final Plan</span>
        </div>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="mt-4 text-center bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
        <p>{message}</p>
    </div>
);

const SummaryScreen: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { caseState, setPreliminaryData, setInvestigationResults, setExaminationResults, setFinalData, setFeedback, completeCaseAndSave } = useAppContext();
    
    const [phase, setPhase] = useState<'initial' | 'results'>('initial');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [prelimDiagnosis, setPrelimDiagnosis] = useState(caseState.preliminaryDiagnosis);
    const [examinationPlan, setExaminationPlan] = useState(caseState.examinationPlan);
    const [investigationPlan, setInvestigationPlan] = useState(caseState.investigationPlan);
    const [finalDiagnosis, setFinalDiagnosis] = useState(caseState.finalDiagnosis || prelimDiagnosis);
    const [managementPlan, setManagementPlan] = useState(caseState.managementPlan);

    // Update case state when text inputs change
    const handlePrelimDiagnosisChange = (value: string) => {
        setPrelimDiagnosis(value);
        setPreliminaryData(value, examinationPlan, investigationPlan);
    };

    const handleExaminationPlanChange = (value: string) => {
        setExaminationPlan(value);
        setPreliminaryData(prelimDiagnosis, value, investigationPlan);
    };

    const handleInvestigationPlanChange = (value: string) => {
        setInvestigationPlan(value);
        setPreliminaryData(prelimDiagnosis, examinationPlan, value);
    };

    const handleFinalDiagnosisChange = (value: string) => {
        setFinalDiagnosis(value);
        setFinalData(value, managementPlan);
    };

    const handleManagementPlanChange = (value: string) => {
        setManagementPlan(value);
        setFinalData(finalDiagnosis, value);
    };

    // Check URL parameters and case state to determine initial phase
    useEffect(() => {
        const tab = searchParams.get('tab');
        const hasExaminationResults = caseState.examinationResults && caseState.examinationResults.length > 0;
        const hasInvestigationResults = caseState.investigationResults && caseState.investigationResults.length > 0;
        
        console.log('🔍 [SummaryScreen] Checking initial phase:', {
            tab,
            hasExaminationResults,
            hasInvestigationResults,
            examinationResultsCount: caseState.examinationResults?.length || 0,
            investigationResultsCount: caseState.investigationResults?.length || 0
        });
        
        // If URL has tab=examination or case has examination/investigation results, show results phase
        if (tab === 'examination' || hasExaminationResults || hasInvestigationResults) {
            console.log('🎯 [SummaryScreen] Setting phase to results');
            setPhase('results');
        } else {
            console.log('🎯 [SummaryScreen] Setting phase to initial');
            setPhase('initial');
        }
    }, [searchParams, caseState.examinationResults, caseState.investigationResults]);

    // React.useEffect(() => {
    //   if (!caseState.department || !caseState.caseId) {
    //       router.push('/');
    //   }
    // }, [caseState, router]);

    const handleApiError = (err: unknown) => {
        let message = "An unknown error occurred.";
        if (err instanceof Error) {
            message = err.message.startsWith('QUOTA_EXCEEDED') ? err.message.split(': ')[1] : err.message;
        }
        setError(message);
    };

    const handleRequestResults = async () => {
        if (!examinationPlan.trim() && !investigationPlan.trim()) {
            setError("Please enter an examination plan and/or investigation plan.");
            return;
        }
        if (!caseState.caseId) {
            setError("Case ID is not available.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            setPreliminaryData(prelimDiagnosis, examinationPlan, investigationPlan);
            
            // Generate examination and investigation results in parallel
            const promises = [];
            
            // Add examination results promise if plan is provided
            if (examinationPlan.trim()) {
                promises.push(
                    getExaminationResults(examinationPlan, caseState.caseId || undefined, caseState.sessionId || undefined)
                        .then(results => ({ type: 'examination', results, success: true }))
                        .catch(async (examError) => {
                            console.warn('Failed to get examination results, retrying...', examError);
                            try {
                                // Retry examination results
                                const retryResults = await getExaminationResults(examinationPlan, caseState.caseId || undefined, caseState.sessionId || undefined);
                                return { type: 'examination', results: retryResults, success: true };
                            } catch (retryError) {
                                console.error('Examination results retry failed:', retryError);
                                return { type: 'examination', error: retryError, success: false };
                            }
                        })
                );
            }
            
            // Add investigation results promise if plan is provided
            if (investigationPlan.trim()) {
                promises.push(
                    getInvestigationResults(investigationPlan, caseState.caseId || undefined, caseState.sessionId || undefined)
                        .then(results => ({ type: 'investigation', results, success: true }))
                        .catch(async (invError) => {
                            console.warn('Failed to get investigation results, retrying...', invError);
                            try {
                                // Retry investigation results
                                const retryResults = await getInvestigationResults(investigationPlan, caseState.caseId || undefined, caseState.sessionId || undefined);
                                return { type: 'investigation', results: retryResults, success: true };
                            } catch (retryError) {
                                console.error('Investigation results retry failed:', retryError);
                                return { type: 'investigation', error: retryError, success: false };
                            }
                        })
                );
            }
            
            // Wait for all promises to settle (both success and failure)
            const results = await Promise.allSettled(promises);
            
            // Process results and update state atomically
            let hasErrors = false;
            
            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const { type, results: data, success } = result.value;
                    
                    if (success && data) {
                        if (type === 'examination') {
                            setExaminationResults(data as ExaminationResult[]);
                        } else if (type === 'investigation') {
                            setInvestigationResults(data as InvestigationResult[]);
                        }
                    } else {
                        hasErrors = true;
                        const error = (result.value as any).error;
                        console.error(`${type} results failed:`, error);
                    }
                } else {
                    hasErrors = true;
                    console.error('Promise rejected:', result.reason);
                }
            });
            
            // Only proceed if we have at least some successful results
            // Note: We can't check the state variables here as they haven't been updated yet
            // The error handling is done above in the forEach loop
            
            setFinalDiagnosis(prelimDiagnosis);
            setPhase('results');
            
            // Case state and results are automatically saved to localStorage (secondary context)
            // Primary context is secured in JWT cookies
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitForFeedback = async (): Promise<void> => {
        setError(null);
        setIsLoading(true);
        
        try {
            setFinalData(finalDiagnosis, managementPlan);
            
            // Complete case and get feedback (standard flow only)
            const caseCompleted = await completeCaseAndSave();
            
            if (!caseCompleted) {
                throw new Error("Failed to complete and save case");
            }
            
            // Navigate to feedback page immediately - case report continues in background
            router.push('/feedback');
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!caseState.department || !caseState.caseId) {
        return null; // or a loading/error state
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 transition-colors duration-300">
            <header className="flex items-center mb-4">
                <button onClick={() => router.push(phase === 'initial' ? '/clerking' : '#')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" disabled={phase === 'results'}>
                    <Icon name="arrow-left" size={24} className={phase === 'results' ? 'text-slate-400 dark:text-slate-600' : ''} />
                </button>
                <h1 className="text-2xl sm:text-3xl font-bold text-center flex-grow">Clinical Summary</h1>
                <div className="w-8"></div>
            </header>
            
            <ProgressIndicator step={phase === 'initial' ? 1 : 2} />
            
            <main className="max-w-3xl mx-auto space-y-8">
                {phase === 'initial' && (
                    <>
                        <div>
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Differential Diagnosis</label>
                            <textarea value={prelimDiagnosis} onChange={(e) => handlePrelimDiagnosisChange(e.target.value)} rows={4} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Enter your working diagnosis..."></textarea>
                        </div>
                        <div>
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Examinations</label>
                            <textarea value={examinationPlan} onChange={(e) => handleExaminationPlanChange(e.target.value)} rows={4} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="e.g., General examination, Cardiovascular examination, Respiratory examination..."></textarea>
                        </div>
                        <div>
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Investigation Plan</label>
                            <textarea value={investigationPlan} onChange={(e) => handleInvestigationPlanChange(e.target.value)} rows={4} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="e.g., Full Blood Count, Liver Function Tests, Ultrasound..."></textarea>
                        </div>
                        <div className="flex flex-col items-center">
                            <button onClick={handleRequestResults} disabled={isLoading} className="w-full sm:max-w-md bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 hover:scale-105 transform transition-transform duration-200 disabled:opacity-50 disabled:cursor-wait">
                                {isLoading ? (
                                    <>
                                        <Icon name="loader-2" size={20} className="animate-spin" />
                                        <span>Generating Results...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Request Results</span>
                                        <Icon name="chevrons-right" size={20} />
                                    </>
                                )}
                            </button>
                             {error && <ErrorDisplay message={error} />}
                        </div>
                    </>
                )}

                {phase === 'results' && (
                    <>
                        {caseState.examinationResults.length > 0 && (
                            <ExaminationResults results={caseState.examinationResults} />
                        )}
                        {caseState.investigationResults.length > 0 && (
                            <InvestigationResults results={caseState.investigationResults} />
                        )}
                        <div>
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Final Diagnosis</label>
                            <textarea value={finalDiagnosis} onChange={(e) => handleFinalDiagnosisChange(e.target.value)} rows={4} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Confirm or update your diagnosis..."></textarea>
                        </div>
                        <div>
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Management Plan</label>
                            <textarea value={managementPlan} onChange={(e) => handleManagementPlanChange(e.target.value)} rows={6} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Outline your treatment approach..."></textarea>
                        </div>
                        <div className="flex flex-col items-center">
                            <button onClick={handleSubmitForFeedback} disabled={isLoading} className="w-full sm:max-w-md bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 hover:scale-105 transform transition-transform duration-200 disabled:opacity-50 disabled:cursor-wait">
                                {isLoading ? (
                                    <>
                                        <Icon name="loader-2" size={20} className="animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Submit for Feedback</span>
                                        <Icon name="award" size={20} />
                                    </>
                                )}
                            </button>
                             {error && <ErrorDisplay message={error} />}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default SummaryScreen; 