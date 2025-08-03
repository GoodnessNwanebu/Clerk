'use client';

import React from 'react';
import { Icon } from './Icon';

interface ResumeCaseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onDismiss: () => void;
  caseInfo: {
    department: string;
    lastUpdated: string;
  };
}

export const ResumeCaseModal: React.FC<ResumeCaseModalProps> = ({
  isOpen,
  onResume,
  onDismiss,
  caseInfo
}) => {
  if (!isOpen) return null;

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
              <Icon name="play-circle" size={28} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Resume Case?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                You have an incomplete case
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Dismiss and clear saved case"
          >
            <Icon name="x" size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Case Info */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 mb-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Department
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {caseInfo.department}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Last Updated
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatLastUpdated(caseInfo.lastUpdated)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onResume}
          className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:scale-[1.02] transform transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        >
          Resume Case
        </button>
      </div>
    </div>
  );
}; 