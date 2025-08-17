'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { getInvestigationResults, getExaminationResults, getComprehensiveCaseFeedback } from '../../services/geminiService';
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
    const { caseState, setPreliminaryData, setInvestigationResults, setExaminationResults, setFinalData, setFeedback, saveCaseStateToDatabase, saveResultsToDatabase } = useAppContext();
    const [phase, setPhase] = useState<'initial' | 'results'>('initial');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [prelimDiagnosis, setPrelimDiagnosis] = useState(caseState.preliminaryDiagnosis);
    const [examinationPlan, setExaminationPlan] = useState(caseState.examinationPlan);
    const [investigationPlan, setInvestigationPlan] = useState(caseState.investigationPlan);
    const [finalDiagnosis, setFinalDiagnosis] = useState(caseState.finalDiagnosis || prelimDiagnosis);
    const [managementPlan, setManagementPlan] = useState(caseState.managementPlan);

    React.useEffect(() => {
      if (!caseState.department || !caseState.caseDetails) {
          router.push('/');
      }
    }, [caseState, router]);

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
        if (!caseState.caseDetails) {
            setError("Case details are not available.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            setPreliminaryData(prelimDiagnosis, examinationPlan, investigationPlan);
            
            // Get examination results if examination plan is provided
            let examinationResults: ExaminationResult[] = [];
            if (examinationPlan.trim()) {
                try {
                    examinationResults = await getExaminationResults(examinationPlan, caseState.caseDetails);
                    setExaminationResults(examinationResults);
                } catch (examError) {
                    console.warn('Failed to get examination results, retrying...', examError);
                    // Retry examination results
                    examinationResults = await getExaminationResults(examinationPlan, caseState.caseDetails);
                    setExaminationResults(examinationResults);
                }
            }
            
            // Get investigation results if investigation plan is provided
            let investigationResults: InvestigationResult[] = [];
            if (investigationPlan.trim()) {
                try {
                    investigationResults = await getInvestigationResults(investigationPlan, caseState.caseDetails);
                    setInvestigationResults(investigationResults);
                } catch (invError) {
                    console.warn('Failed to get investigation results, retrying...', invError);
                    // Retry investigation results
                    investigationResults = await getInvestigationResults(investigationPlan, caseState.caseDetails);
                    setInvestigationResults(investigationResults);
                }
            }
            
            setFinalDiagnosis(prelimDiagnosis);
            setPhase('results');
            
            // Save case state and results to database in background
            saveCaseStateToDatabase();
            saveResultsToDatabase();
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitForFeedback = async () => {
        setError(null);
        setIsLoading(true);
        
        try {
            setFinalData(finalDiagnosis, managementPlan);
            
            // Retry feedback generation with exponential backoff
            let feedback: ComprehensiveFeedback | null = null;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!feedback && retryCount <= maxRetries) {
                try {
                    feedback = await getComprehensiveCaseFeedback({
                        ...caseState,
                        finalDiagnosis,
                        managementPlan
                    });
                } catch (feedbackError) {
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        console.warn(`Feedback generation failed, retrying ${retryCount}/${maxRetries}...`, feedbackError);
                        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))); // Exponential backoff
                    } else {
                        throw feedbackError;
                    }
                }
            }

            if (feedback) {
                setFeedback(feedback);
                router.push('/feedback');
            } else {
                throw new Error("Could not generate feedback at this time.");
            }
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!caseState.department || !caseState.caseDetails) {
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
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Preliminary Diagnosis</label>
                            <textarea value={prelimDiagnosis} onChange={(e) => setPrelimDiagnosis(e.target.value)} rows={4} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Enter your working diagnosis..."></textarea>
                        </div>
                        <div>
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Examinations</label>
                            <textarea value={examinationPlan} onChange={(e) => setExaminationPlan(e.target.value)} rows={4} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="e.g., General examination, Cardiovascular examination, Respiratory examination..."></textarea>
                        </div>
                        <div>
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Investigation Plan</label>
                            <textarea value={investigationPlan} onChange={(e) => setInvestigationPlan(e.target.value)} rows={4} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="e.g., Full Blood Count, Liver Function Tests, Ultrasound..."></textarea>
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
                            <textarea value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)} rows={4} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Confirm or update your diagnosis..."></textarea>
                        </div>
                        <div>
                            <label className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Management Plan</label>
                            <textarea value={managementPlan} onChange={(e) => setManagementPlan(e.target.value)} rows={6} className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" placeholder="Outline your treatment approach..."></textarea>
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