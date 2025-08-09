import React from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  shareData: {
    diagnosis: string;
    correctDiagnosis: string;
    achievementText: string;
  } | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, shareData }) => {
  if (!isOpen || !shareData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        
        {/* Simple header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Share Your Achievement
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Let your friends know about this case
          </p>
        </div>

        {/* Clean preview card */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-600">
          <p className="text-slate-700 dark:text-slate-300 text-center">
            "{shareData.achievementText}
            <br />
            Correctly diagnosed: <span className="font-semibold text-teal-600 dark:text-teal-400">{shareData.diagnosis}</span>
            <br />
            In the top 2% of ClerkSmart users this week"
          </p>
        </div>

        {/* Simple buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onShare}
            className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform"
          >
            Share on WhatsApp
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
