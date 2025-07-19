'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { EmailCaptureModal } from '../../components/EmailCaptureModal';
import { getDetailedCaseFeedback } from '../../services/geminiService';
import { sendFeedbackEmail } from '../../services/emailService';

const FeedbackScreen: React.FC = () => {
    const router = useRouter();
    const { caseState, resetCase, userEmail, setUserEmail } = useAppContext();
    const { feedback, department } = caseState;
    
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sent' | 'error'>('idle');
    const [emailError, setEmailError] = useState<string | null>(null);


    React.useEffect(() => {
        if (!feedback || !department) {
            router.push('/');
        }
    }, [feedback, department, router]);

    const handleSendEmailReport = async (email: string) => {
        if (!caseState.caseDetails) {
            alert("Case details are missing.");
            return;
        }
        setIsSendingEmail(true);
        setEmailStatus('idle');
        setEmailError(null);

        try {
            const detailedReport = await getDetailedCaseFeedback(caseState);
            if (!detailedReport) {
                throw new Error("Failed to generate the detailed report for the email.");
            }
            
            const result = await sendFeedbackEmail(detailedReport, email);

            if (result.success) {
                setEmailStatus('sent');
            } else {
                throw new Error("Email sending service failed.");
            }

        } catch (error) {
            console.error('Error in handleSendEmailReport:', error);
            
            let errorMessage = "An error occurred while preparing the report. Please try again.";
            
            if (error instanceof Error) {
                if (error.message.startsWith('QUOTA_EXCEEDED')) {
                    errorMessage = error.message.split(': ')[1] || "API quota exceeded. Please try again tomorrow.";
                } else if (error.message.includes('Missing required case data')) {
                    errorMessage = "Case data is incomplete. Please restart the case.";
                } else if (error.message.includes('Invalid response format')) {
                    errorMessage = "There was an issue generating the report. Please try again.";
                } else if (error.message.includes('Server error')) {
                    errorMessage = "Server is temporarily unavailable. Please try again in a few minutes.";
                } else if (error.message.includes('Network error')) {
                    errorMessage = "Network connection issue. Please check your internet and try again.";
                } else {
                    errorMessage = error.message;
                }
            }
            
            setEmailError(errorMessage);
            setEmailStatus('error');
        } finally {
            setIsSendingEmail(false);
        }
    };
    
    const handleEmailButtonClick = () => {
        if (emailStatus === 'error') { // Allow retry on error
            setEmailStatus('idle');
            setEmailError(null);
        }

        if (userEmail) {
            handleSendEmailReport(userEmail);
        } else {
            setIsEmailModalOpen(true);
        }
    };

    const handleEmailModalSubmit = (email: string) => {
        setUserEmail(email);
        setIsEmailModalOpen(false);
        handleSendEmailReport(email);
    };

    const handleDone = () => {
        resetCase();
        router.push('/');
    };
    
    if (!feedback || !department) {
        return null;
    }

    const getEmailButtonContent = () => {
        if (isSendingEmail) {
            return <><Icon name="loader-2" size={20} className="animate-spin mr-2" /> Sending...</>;
        }
        if (emailStatus === 'sent') {
            return <><Icon name="check" size={20} className="mr-2" /> Sent to {userEmail}</>;
        }
        if (emailStatus === 'error') {
            return <>Error! Try Again</>;
        }
        return <> <Icon name="mail" size={20} className="mr-2"/> Email Me the Full Report</>;
    };

    return (
        <>
        <EmailCaptureModal 
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            onSubmit={handleEmailModalSubmit}
        />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 transition-colors duration-300">
            <header className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold">Case Report & Feedback</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-1">
                    Final Diagnosis: <span className="font-semibold text-teal-500 dark:text-teal-400">{feedback.diagnosis}</span> ({department.name})
                </p>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                {/* Key Takeaway */}
                <div className="bg-white dark:bg-slate-800/70 border border-teal-500/10 dark:border-teal-500/30 p-5 rounded-xl shadow-md dark:shadow-none">
                    <div className="flex items-start">
                        <Icon name="chevrons-right" className="text-teal-500 dark:text-teal-400 mr-4 flex-shrink-0 mt-1" size={24}/>
                        <div>
                            <h3 className="text-xl font-bold">Key Takeaway</h3>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">{feedback.keyTakeaway}</p>
                        </div>
                    </div>
                </div>

                {/* Feedback Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                    {/* What Could Be Improved */}
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <Icon name="alert-triangle" className="text-amber-500 dark:text-amber-400 mr-3" size={24}/>
                            <h3 className="text-xl font-bold">Areas for Improvement</h3>
                        </div>
                        <ul className="space-y-3">
                            {feedback.whatCouldBeImproved.map((point, index) => (
                                <li key={index} className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg text-slate-700 dark:text-slate-300">{point}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Clinical Tip */}
                 <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-5 rounded-xl">
                    <div className="flex items-start">
                        <Icon name="lightbulb" className="text-blue-500 dark:text-blue-400 mr-4 flex-shrink-0 mt-1" size={24}/>
                        <div>
                            <h3 className="text-xl font-bold">Clinical Tip</h3>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">{feedback.clinicalTip}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-center gap-4 pt-6 max-w-lg mx-auto">
                    <button
                        onClick={handleEmailButtonClick}
                        disabled={isSendingEmail || emailStatus === 'sent'}
                        className={`w-full py-3 px-6 border-2 font-semibold rounded-lg transition-colors flex items-center justify-center
                        ${emailStatus === 'sent' ? 'border-green-500/30 bg-green-500/10 text-green-500 cursor-default' : 
                         emailStatus === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20' :
                         isSendingEmail ? 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-wait' :
                         'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                    >
                        {getEmailButtonContent()}
                    </button>
                    {emailError && <p className="text-red-500 dark:text-red-400 text-sm text-center">{emailError}</p>}
                    
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                        <span>Done</span>
                        <Icon name="check" size={20} />
                    </button>
                </div>
            </main>
        </div>
        </>
    );
};

export default FeedbackScreen; 