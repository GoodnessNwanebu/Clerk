'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { ComprehensiveFeedback, Feedback } from '../../types';

const FeedbackScreen: React.FC = () => {
    const router = useRouter();
    const { caseState, resetCase, saveFeedbackToDatabase } = useAppContext();
    const { feedback, department } = caseState;
    
    const [expandedSections, setExpandedSections] = useState<{
        clinicalOpportunities: boolean;
        clinicalPearls: boolean;
    }>({
        clinicalOpportunities: false,
        clinicalPearls: false
    });

    React.useEffect(() => {
        if (!feedback || !department) {
            router.push('/');
        }
    }, [feedback, department, router]);

    const toggleSection = (section: 'clinicalOpportunities' | 'clinicalPearls') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSaveCase = async () => {
        // TODO: Implement save case functionality
        console.log('Save case functionality to be implemented');
    };

    const handleDone = async () => {
        // Save feedback to database in background
        await saveFeedbackToDatabase();
        resetCase();
        router.push('/');
    };
    
    if (!feedback || !department) {
        return null;
    }

    // Type guard to check if feedback is comprehensive
    const isComprehensiveFeedback = (f: any): f is ComprehensiveFeedback => {
        return f && 'clinicalReasoning' in f && 'clinicalOpportunities' in f && 'clinicalPearls' in f;
    };

    const isBasicFeedback = (f: any): f is Feedback => {
        return f && 'whatCouldBeImproved' in f && 'clinicalTip' in f;
    };

    const comprehensiveFeedback = isComprehensiveFeedback(feedback) ? feedback : null;
    const basicFeedback = isBasicFeedback(feedback) ? feedback : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 transition-colors duration-300">
            <header className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold">Case Report & Feedback</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">
                    Final Diagnosis: <span className="font-semibold text-teal-500 dark:text-teal-400">{feedback.diagnosis}</span> ({department.name})
                </p>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                {/* Key Learning Point */}
                <div className="bg-white dark:bg-slate-800/70 border border-teal-500/10 dark:border-teal-500/30 p-5 rounded-xl shadow-md dark:shadow-none">
                    <div className="flex items-start">
                        <Icon name="chevrons-right" className="text-teal-500 dark:text-teal-400 mr-4 flex-shrink-0 mt-1" size={24}/>
                        <div>
                            <h3 className="text-xl font-bold">Key Learning Point</h3>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">{feedback.keyLearningPoint}</p>
                        </div>
                    </div>
                </div>

                {/* What You Did Well */}
                <div className="space-y-4">
                    <div className="flex items-center">
                        <Icon name="check" className="text-green-500 dark:text-green-400 mr-3" size={24}/>
                        <h3 className="text-xl font-bold">What You Did Well</h3>
                    </div>
                    <ul className="space-y-3">
                        {feedback.whatYouDidWell.map((point, index) => (
                            <li key={index} className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg text-slate-700 dark:text-slate-300">{point}</li>
                        ))}
                    </ul>
                </div>

                {/* Clinical Reasoning */}
                {comprehensiveFeedback && (
                    <div className="bg-white dark:bg-slate-800/70 border border-blue-500/10 dark:border-blue-500/30 p-5 rounded-xl shadow-md dark:shadow-none">
                        <div className="flex items-start">
                            <Icon name="brain" className="text-blue-500 dark:text-blue-400 mr-4 flex-shrink-0 mt-1" size={24}/>
                            <div>
                                <h3 className="text-xl font-bold">Clinical Reasoning</h3>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{comprehensiveFeedback.clinicalReasoning}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clinical Opportunities - Collapsible */}
                {comprehensiveFeedback && (
                    <div className="bg-white dark:bg-slate-800/70 border border-amber-500/10 dark:border-amber-500/30 rounded-xl shadow-md dark:shadow-none overflow-hidden">
                        <button
                            onClick={() => toggleSection('clinicalOpportunities')}
                            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center">
                                <Icon name="alert-triangle" className="text-amber-500 dark:text-amber-400 mr-3" size={24}/>
                                <h3 className="text-xl font-bold">Clinical Opportunities</h3>
                            </div>
                            <Icon 
                                name={expandedSections.clinicalOpportunities ? "chevron-up" : "chevron-down"} 
                                className="text-slate-500 dark:text-slate-400" 
                                size={20}
                            />
                        </button>
                        
                        {expandedSections.clinicalOpportunities && (
                            <div className="px-5 pb-5 space-y-4">
                                {/* Areas for Improvement */}
                                {comprehensiveFeedback.clinicalOpportunities.areasForImprovement.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Areas for Improvement</h4>
                                        <ul className="space-y-2">
                                            {comprehensiveFeedback.clinicalOpportunities.areasForImprovement.map((point, index) => (
                                                <li key={index} className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg text-slate-700 dark:text-slate-300">{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {/* Missed Opportunities */}
                                {comprehensiveFeedback.clinicalOpportunities.missedOpportunities.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Missed Opportunities</h4>
                                        <ul className="space-y-3">
                                            {comprehensiveFeedback.clinicalOpportunities.missedOpportunities.map((opportunity, index) => (
                                                <li key={index} className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg">
                                                    <p className="text-slate-700 dark:text-slate-300 font-medium">{opportunity.opportunity}</p>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{opportunity.clinicalSignificance}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Clinical Pearls - Collapsible */}
                {comprehensiveFeedback && (
                    <div className="bg-white dark:bg-slate-800/70 border border-purple-500/10 dark:border-purple-500/30 rounded-xl shadow-md dark:shadow-none overflow-hidden">
                        <button
                            onClick={() => toggleSection('clinicalPearls')}
                            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center">
                                <Icon name="lightbulb" className="text-purple-500 dark:text-purple-400 mr-3" size={24}/>
                                <h3 className="text-xl font-bold">Clinical Pearls</h3>
                            </div>
                            <Icon 
                                name={expandedSections.clinicalPearls ? "chevron-up" : "chevron-down"} 
                                className="text-slate-500 dark:text-slate-400" 
                                size={20}
                            />
                        </button>
                        
                        {expandedSections.clinicalPearls && (
                            <div className="px-5 pb-5">
                                <ul className="space-y-3">
                                    {comprehensiveFeedback.clinicalPearls.map((pearl, index) => (
                                        <li key={index} className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg text-slate-700 dark:text-slate-300">{pearl}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Fallback Clinical Tip for non-comprehensive feedback */}
                {!comprehensiveFeedback && basicFeedback && basicFeedback.clinicalTip && (
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-5 rounded-xl">
                        <div className="flex items-start">
                            <Icon name="lightbulb" className="text-blue-500 dark:text-blue-400 mr-4 flex-shrink-0 mt-1" size={24}/>
                            <div>
                                <h3 className="text-xl font-bold">Clinical Tip</h3>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{basicFeedback.clinicalTip}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col items-center gap-4 pt-6 max-w-lg mx-auto">
                    <button
                        onClick={handleSaveCase}
                        className="w-full py-3 px-6 border-2 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 font-semibold rounded-lg transition-colors flex items-center justify-center"
                    >
                        <Icon name="bookmark" size={20} className="mr-2"/> Save This Case
                    </button>
                    
                    <button
                        onClick={handleDone}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>Done</span>
                        <Icon name="check" size={20} />
                    </button>
                </div>
            </main>
        </div>
    );
};

export default FeedbackScreen; 