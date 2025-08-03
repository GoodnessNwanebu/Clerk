'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../components/Icon';
import { ConversationStorageUtils, ConversationStorage } from '../../lib/localStorage';

interface SavedCase {
  caseId: string;
  department: string;
  lastUpdated: string;
  messageCount: number;
}

export default function SavedCasesPage() {
  const router = useRouter();
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedCases = () => {
      try {
        // Ensure we're on the client side
        if (typeof window === 'undefined') return;
        
        const conversations = ConversationStorageUtils.getAllConversations();
        const cases: SavedCase[] = conversations
          .filter(conv => conv.caseState?.department)
          .map(conv => ({
            caseId: conv.caseId,
            department: conv.caseState.department!.name,
            lastUpdated: conv.lastUpdated,
            messageCount: conv.conversation?.length || 0
          }))
          .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        
        setSavedCases(cases);
        setLoading(false);
      } catch (err) {
        console.error('Error loading saved cases:', err);
        setError('Failed to load saved cases');
        setLoading(false);
      }
    };

    loadSavedCases();
  }, []);

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    } catch (err) {
      return 'Unknown';
    }
  };

  const handleResumeCase = (caseId: string) => {
    try {
      // Ensure we're on the client side
      if (typeof window === 'undefined') return;
      
      // Set this case as the active one (clear others and keep only this one)
      const conversations = ConversationStorageUtils.getAllConversations();
      const targetCase = conversations.find(conv => conv.caseId === caseId);
      
      if (targetCase) {
        // Clear all cases first
        ConversationStorageUtils.clearAll();
        
        // Re-save only the target case
        const storage = new ConversationStorage(targetCase.caseId);
        storage.saveConversation(targetCase.conversation, targetCase.caseState);
        
        router.push('/clerking');
      }
    } catch (err) {
      console.error('Error resuming case:', err);
      setError('Failed to resume case');
    }
  };

  const handleDeleteCase = (caseId: string) => {
    try {
      // Ensure we're on the client side
      if (typeof window === 'undefined') return;
      
      // Remove this specific case from localStorage
      const conversations = ConversationStorageUtils.getAllConversations();
      const updatedCases = conversations.filter(conv => conv.caseId !== caseId);
      
      // Clear all and re-save the remaining ones
      ConversationStorageUtils.clearAll();
      updatedCases.forEach(conv => {
        const storage = new ConversationStorage(conv.caseId);
        storage.saveConversation(conv.conversation, conv.caseState);
      });
      
      // Update the UI
      setSavedCases(prev => prev.filter(c => c.caseId !== caseId));
    } catch (err) {
      console.error('Error deleting case:', err);
      setError('Failed to delete case');
    }
  };

  const handleClearAll = () => {
    try {
      // Ensure we're on the client side
      if (typeof window === 'undefined') return;
      
      ConversationStorageUtils.clearAll();
      setSavedCases([]);
    } catch (err) {
      console.error('Error clearing all cases:', err);
      setError('Failed to clear all cases');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="loader-2" size={32} className="animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading saved cases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="alert-circle" size={32} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white p-6 sm:p-8 transition-colors duration-300">
      <header className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.push('/')} 
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <Icon name="arrow-left" size={24} />
        </button>
        <h1 className="text-2xl font-bold text-center">Saved Cases</h1>
        <div className="w-10"></div>
      </header>

      {savedCases.length === 0 ? (
        <div className="text-center py-16">
          <Icon name="book-open" size={64} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No Saved Cases</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Your incomplete cases will appear here when you pause a simulation.
          </p>
          <button
            onClick={() => router.push('/departments')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-lg hover:scale-105 transform transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Start New Case
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-slate-600 dark:text-slate-400">
              {savedCases.length} saved case{savedCases.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleClearAll}
              className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-4">
            {savedCases.map((savedCase) => (
              <div
                key={savedCase.caseId}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                      <Icon name="play-circle" size={24} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {savedCase.department}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {savedCase.messageCount} messages • {formatLastUpdated(savedCase.lastUpdated)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleResumeCase(savedCase.caseId)}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:scale-105 transform transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => handleDeleteCase(savedCase.caseId)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Icon name="trash-2" size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 