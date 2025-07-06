import React, { useState } from 'react';
import { Icon } from './Icon';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic email validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setError('');
        onSubmit(email);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-slate-900 dark:text-white w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Get Your Detailed Report</h2>
                        <button type="button" onClick={onClose} className="p-2 -mr-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <Icon name="x" size={24} />
                        </button>
                    </div>
                    
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Enter your email to receive a full, in-depth analysis of your performance. We'll remember it for next time.
                    </p>

                    <div className="space-y-2">
                        <label htmlFor="email" className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-700 p-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                            placeholder="you@example.com"
                            required
                        />
                         {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>

                    <button 
                        type="submit" 
                        className="w-full mt-6 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:scale-105 transform transition-transform duration-200"
                    >
                        <span>Submit & Send Report</span>
                        <Icon name="mail" size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};
