'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../components/Icon';
import { useAppContext } from '../../context/AppContext';
import { useSavedCasesCache } from '../../hooks/useSavedCasesCache';

export default function SavedCasesPage() {
  const router = useRouter();
  const { userEmail, toggleCaseVisibility } = useAppContext();
  const { 
    cases: completedCases, 
    isLoading, 
    error, 
    refreshCases,
    removeCase
  } = useSavedCasesCache(userEmail);
  
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);

  // Debug logging
  console.log('🔄 SavedCasesPage render:', { userEmail, casesCount: completedCases.length, isLoading, error });

  const handleViewCase = (caseId: string) => {
    router.push(`/saved-cases/${caseId}`);
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      setDeletingCaseId(caseId);
      
      // Toggle visibility to false (hide the case)
      const success = await toggleCaseVisibility(caseId, false);
      
      if (success) {
        // Remove from cache immediately for better UX
        removeCase(caseId);
        console.log('✅ Case hidden successfully');
      } else {
        console.error('❌ Failed to hide case');
      }
    } catch (error) {
      console.error('Error hiding case:', error);
    } finally {
      setDeletingCaseId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <Icon name="loader-2" size={48} className="animate-spin text-teal-600 dark:text-teal-400 mx-auto mb-6" />
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Loading Your Cases</h3>
            <p className="text-slate-500 dark:text-slate-400">Fetching your saved cases...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen px-6">
          <div className="text-center max-w-md">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="alert-circle" size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Oops! Something went wrong</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
              <button 
                onClick={refreshCases}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Icon name="arrow-left" size={24} className="text-slate-600 dark:text-slate-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Cases</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Your learning journey in review
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <Icon name="book-open" size={16} />
                <span>{completedCases.length} case{completedCases.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={refreshCases}
                disabled={isLoading}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh saved cases"
              >
                <Icon name="refresh-cw" size={20} className={`text-slate-600 dark:text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {completedCases.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-sm">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                {/* Hero Icon */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center mx-auto">
                    <Icon name="book-open" size={32} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <Icon name="plus" size={12} className="text-white" />
                  </div>
                </div>

                {/* Content */}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Ready to start your learning journey?
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">
                  Complete cases and save them from the feedback page to build your personal library of clinical experiences.
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/departments')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Start Your First Case
                  </button>
                  <button 
                    onClick={() => router.push('/practice')}
                    className="w-full px-6 py-2 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 text-sm"
                  >
                    Practice Mode
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Your Learning Library
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {completedCases.length} case{completedCases.length !== 1 ? 's' : ''} completed and saved
                  </p>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <Icon name="filter" size={20} className="text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">All Departments</span>
                </div> */}
              </div>
            </div>

            {/* Cases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {completedCases.map((completedCase) => (
                <div
                  key={completedCase.id}
                  className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-teal-200 dark:hover:border-teal-700 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => handleViewCase(completedCase.id)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {completedCase.department.name}
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteCase(completedCase.id); 
                      }}
                      disabled={deletingCaseId === completedCase.id}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Hide case"
                    >
                      {deletingCaseId === completedCase.id ? (
                        <Icon name="loader-2" size={16} className="animate-spin" />
                      ) : (
                        <Icon name="trash-2" size={16} />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {completedCase.diagnosis}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Icon name="calendar" size={14} />
                      <span>{formatDate(completedCase.completedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Icon name="eye" size={14} />
                      <span>View</span>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 