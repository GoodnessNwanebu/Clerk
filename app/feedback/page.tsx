'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { ComprehensiveFeedback, Feedback } from '../../types';
import ReactMarkdown from 'react-markdown';
import ShareModal from '../../components/modals/ShareModal';
import { shareOnWhatsApp } from '../../lib/shared/shareUtils';
import { ShareData } from '../../types/share';
import { ConversationStorageUtils } from '../../lib/storage/localStorage';
import { useInstallGuide } from '../../hooks/useInstallGuide';
import PWATutorialModal from '../../components/PWATutorialModal';

export default function FeedbackPage() {
    const { 
        caseState, 
        resetCase, 
        setNavigationEntryPoint,
        completeCaseAndSave,
        toggleCaseVisibility
    } = useAppContext();
    
    const { feedback, department } = caseState;
    
    const router = useRouter();
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareData, setShareData] = useState<any>(null);
    const [expandedSections, setExpandedSections] = useState({
        clinicalOpportunities: false,
        clinicalPearls: false
    });
    const [isCaseCompleted, setIsCaseCompleted] = useState(false);
    const [isCaseVisible, setIsCaseVisible] = useState(false);
    
    // Install guide hook
    const {
        showInstallGuide,
        shouldShowInstallGuide,
        handleShowInstallGuide,
        handleCloseInstallGuide,
        handleCompleteInstallGuide
    } = useInstallGuide();

    // Auto-complete case when feedback page loads
    useEffect(() => {
        const autoCompleteCase = async () => {
            if (feedback && department && !isCaseCompleted) {
                try {
                    console.log('Auto-completing case on feedback page load');
                    const success = await completeCaseAndSave();
                    if (success) {
                        setIsCaseCompleted(true);
                        console.log('Case auto-completed successfully');
                    } else {
                        console.error('Failed to auto-complete case');
                    }
                } catch (error) {
                    console.error('Error auto-completing case:', error);
                }
            }
        };

        autoCompleteCase();
    }, [feedback, department, isCaseCompleted, completeCaseAndSave]);

    // Load share data from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedShareData = localStorage.getItem('pendingShareData');
            if (savedShareData) {
                try {
                    setShareData(JSON.parse(savedShareData));
                } catch (error) {
                    console.error('Error parsing share data:', error);
                }
            }
        }
    }, []);

    // Scroll-to-bottom install guide trigger
    useEffect(() => {
        const handleScroll = () => {
            // Check if user has scrolled to bottom
            const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
            
            if (isAtBottom && shouldShowInstallGuide()) {
                handleShowInstallGuide();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [shouldShowInstallGuide, handleShowInstallGuide]);

    const toggleSection = (section: 'clinicalOpportunities' | 'clinicalPearls') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSaveCase = async () => {
        if (!caseState.caseId) {
            console.error('No case ID available for visibility toggle');
            return;
        }

        try {
            // Show loading state
            const saveButton = document.querySelector('[data-save-case]') as HTMLButtonElement;
            if (saveButton) {
                saveButton.disabled = true;
                saveButton.textContent = 'Saving...';
            }

            // Toggle visibility (make case visible in saved cases)
            const success = await toggleCaseVisibility(caseState.caseId, true);
            
            if (success) {
                setIsCaseVisible(true);
                // Show success message
                alert('Case saved successfully! Your case has been saved and will be available in your saved cases.');
                
                // Update button state
                if (saveButton) {
                    saveButton.textContent = 'Saved ✓';
                    saveButton.classList.add('bg-green-600', 'hover:bg-green-700');
                    setTimeout(() => {
                        saveButton.disabled = false;
                        saveButton.textContent = 'Save This Case';
                        saveButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                    }, 3000);
                }
                
                // Show share modal after successful save
                setShowShareModal(true);
            } else {
                alert('Failed to save case. Please try again.');
            }
        } catch (error) {
            console.error('Error saving case:', error);
            alert('Failed to save case. Please try again.');
        }
    };

    const handleDone = async () => {
        // Feedback is already saved in localStorage (secondary context)
        // Primary context is secured in JWT cookies
        setNavigationEntryPoint('');
        
        // Show share modal instead of going directly to home
        setShowShareModal(true);
        
        // Don't reset case yet - let the share modal handle it
    };
    
    const handleShare = async () => {
        if (shareData) {
            shareOnWhatsApp(shareData);
        }
        await clearLocalStorageAndGoHome();
    };
    
    const handleSkipShare = async () => {
        await clearLocalStorageAndGoHome();
    };
    
    const clearLocalStorageAndGoHome = async () => {
        console.log(`🗑️ [feedback.clearLocalStorageAndGoHome] Clearing localStorage and going home`);
        console.trace('Stack trace for feedback localStorage clear');
        
        // Deactivate session after feedback is complete
        if (caseState.sessionId) {
            try {
                console.log(`🔄 [feedback.clearLocalStorageAndGoHome] Deactivating session: ${caseState.sessionId}`);
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
                console.log(`✅ [feedback.clearLocalStorageAndGoHome] Session deactivated successfully`);
            } catch (error) {
                console.error('❌ [feedback.clearLocalStorageAndGoHome] Error deactivating session:', error);
            }
        }
        
        // Clear all case data
        if (typeof window !== 'undefined') {
            console.log(`🗑️ [feedback.clearLocalStorageAndGoHome] Removing individual localStorage items`);
            localStorage.removeItem('clerkSmartConversation');
            localStorage.removeItem('clerkSmartCaseState');
            localStorage.removeItem('pendingShareData');
            // Clear all case storage to prevent resume modal
            console.log(`🗑️ [feedback.clearLocalStorageAndGoHome] Calling ConversationStorageUtils.clearAll()`);
            ConversationStorageUtils.clearAll();
        }
        resetCase();
        setNavigationEntryPoint('');
        router.push('/');
        console.log(`✅ [feedback.clearLocalStorageAndGoHome] Successfully cleared localStorage and navigated home`);
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <div className="px-4 py-6 sm:px-6">
                    <div className="text-left sm:text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                            Case Report & Feedback
                        </h1>
                        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-2">
                            Final Diagnosis: <span className="font-semibold text-teal-600 dark:text-teal-400">{feedback.diagnosis}</span>
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                            {department}
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-4 py-6 sm:px-6 sm:py-8 max-w-4xl mx-auto space-y-6">
                {/* Key Learning Point */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center mb-4">
                        <Icon name="chevrons-right" className="text-teal-600 dark:text-teal-400 mr-3" size={20}/>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            Key Learning Point
                        </h3>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                        <ReactMarkdown>
                            {feedback.keyLearningPoint}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* What You Did Well */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-4">
                            <Icon name="check" className="text-green-600 dark:text-green-400" size={20}/>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            What You Did Well
                        </h3>
                    </div>
                    <ul className="space-y-3">
                        {feedback.whatYouDidWell.map((point, index) => (
                            <li key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <Icon name="check-circle" className="text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" size={16}/>
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

                {/* Clinical Reasoning */}
                {comprehensiveFeedback && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center mb-4">
                            <Icon name="brain" className="text-blue-600 dark:text-blue-400 mr-3" size={20}/>
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                Clinical Reasoning
                            </h3>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                            <ReactMarkdown>
                                {comprehensiveFeedback.clinicalReasoning}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Clinical Opportunities - Collapsible */}
                {comprehensiveFeedback && (
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
                                {comprehensiveFeedback.clinicalOpportunities.areasForImprovement.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-base">
                                            Areas for Improvement
                                        </h4>
                                        <ul className="space-y-3">
                                            {comprehensiveFeedback.clinicalOpportunities.areasForImprovement.map((point, index) => (
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
                                {comprehensiveFeedback.clinicalOpportunities.missedOpportunities.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-base">
                                            Missed Opportunities
                                        </h4>
                                        <ul className="space-y-4">
                                            {comprehensiveFeedback.clinicalOpportunities.missedOpportunities.map((opportunity, index) => (
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
                )}

                {/* Clinical Pearls - Collapsible */}
                {comprehensiveFeedback && (
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
                                    {comprehensiveFeedback.clinicalPearls.map((pearl, index) => (
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
                )}

                {/* Fallback Clinical Tip for non-comprehensive feedback */}
                {!comprehensiveFeedback && basicFeedback && basicFeedback.clinicalTip && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <Icon name="lightbulb" className="text-blue-600 dark:text-blue-400" size={20}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    Clinical Tip
                                </h3>
                                <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <ReactMarkdown>
                                        {basicFeedback.clinicalTip}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4 pt-6">
                    <button
                        data-save-case
                        onClick={handleSaveCase}
                        className="w-full py-4 px-6 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center space-x-3 text-base"
                    >
                        <Icon name="bookmark" size={20}/>
                        <span>Save This Case</span>
                    </button>
                    
                    <button
                        onClick={handleDone}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-3 text-base"
                    >
                        <span>Done</span>
                        <Icon name="check" size={20}/>
                    </button>
                </div>
            </main>
            
            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={handleSkipShare}
                onShare={handleShare}
                shareData={shareData}
            />
            
            {/* Install Guide Modal */}
            <PWATutorialModal
                isOpen={showInstallGuide}
                onClose={handleCloseInstallGuide}
                onComplete={handleCompleteInstallGuide}
            />
        </div>
    );
}; 