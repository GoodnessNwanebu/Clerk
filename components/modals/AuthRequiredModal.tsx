import React, { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Icon } from '../Icon';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ 
  isOpen, 
  onClose, 
  message 
}) => {
  // Close modal with Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-required-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-slate-900 dark:text-white w-full max-w-md shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 id="auth-required-title" className="text-xl font-bold">Sign In Required</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="bg-teal-500/10 p-4 rounded-full mb-4 inline-block">
            <Icon name="user-check" size={32} className="text-teal-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {message}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in with your Google account to continue
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-lg transition-colors shadow-sm"
          >
            <Icon name="chrome" size={20} />
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
