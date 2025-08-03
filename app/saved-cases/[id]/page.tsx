'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../../components/Icon';

interface CaseData {
  id: string;
  diagnosis: string;
  primaryInfo: string;
  openingLine: string;
  department: { name: string };
  savedAt: string;
  completedAt: string;
  timeSpent: number;
  clinicalSummary: string;
  feedback: {
    keyLearningPoint: string;
    whatYouDidWell: string[];
    whatCouldBeImproved: string[];
    clinicalReasoning: string;
    clinicalPearls: string[];
    missedOpportunities?: Array<{
      opportunity: string;
      clinicalSignificance: string;
    }>;
  };
}

export default function CaseReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [caseId, setCaseId] = useState<string>('');
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setCaseId(resolvedParams.id);
      } catch (error) {
        console.error('Error loading params:', error);
        setError('Failed to load case ID');
        setIsLoading(false);
      }
    };

    loadParams();
  }, [params]);

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!caseId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/cases/${caseId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Case not found');
          } else {
            setError('Failed to load case data');
          }
          return;
        }

        const data = await response.json();
        
        if (data.success && data.case) {
          setCaseData(data.case);
        } else {
          setError('Invalid case data received');
        }
      } catch (error) {
        console.error('Error fetching case data:', error);
        setError('Failed to load case data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseData();
  }, [caseId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Unknown';
    }
  };

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="loader-2" size={32} className="animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading case...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Icon name="alert-circle" size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Error Loading Case</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/saved-cases')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Saved Cases
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="file-x" size={48} className="text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No case data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.push('/saved-cases')} 
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Icon name="arrow-left" size={20} />
            </button>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Icon name="share-2" size={20} />
              </button>
              <button className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                <Icon name="trash-2" size={20} />
              </button>
            </div>
          </div>
          
          {/* Case Info Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {caseData.diagnosis}
              </h1>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Case #{caseData.id}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center space-x-2">
                  <Icon name="calendar" size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(caseData.savedAt)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="clock" size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {formatTimeSpent(caseData.timeSpent)}
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto">
                {caseData.department.name}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Clinical Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
            <Icon name="file-text" size={20} className="mr-2" />
            Clinical Summary
          </h2>
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {caseData.clinicalSummary}
            </p>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-700 my-6" />

        {/* Key Learning Point */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-3">Key Learning Point</h2>
          <p className="text-slate-900 dark:text-white leading-relaxed">{caseData.feedback.keyLearningPoint}</p>
        </div>

        {/* What You Did Well */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
            <Icon name="check-circle" size={20} className="mr-2 text-green-500" />
            What You Did Well
          </h2>
          <ul className="space-y-3">
            {caseData.feedback.whatYouDidWell.map((point, index) => (
              <li key={index} className="flex items-start">
                <Icon name="check" size={16} className="mr-3 mt-0.5 text-green-500 flex-shrink-0" />
                <span className="text-slate-900 dark:text-white">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missed Opportunities */}
        {caseData.feedback.missedOpportunities && caseData.feedback.missedOpportunities.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
              <Icon name="alert-triangle" size={20} className="mr-2 text-amber-500" />
              Missed Opportunities
            </h2>
            <div className="space-y-4">
              {caseData.feedback.missedOpportunities.map((opportunity, index) => (
                <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">{opportunity.opportunity}</p>
                  <p className="text-amber-700 dark:text-amber-300 text-sm italic">
                    <strong>Clinical significance:</strong> {opportunity.clinicalSignificance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="border-slate-200 dark:border-slate-700 my-6" />

        {/* Clinical Reasoning */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-3">Clinical Reasoning</h2>
          <p className="text-slate-900 dark:text-white leading-relaxed">{caseData.feedback.clinicalReasoning}</p>
        </div>

        <hr className="border-slate-200 dark:border-slate-700 my-6" />

        {/* Clinical Pearls */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
            <Icon name="lightbulb" size={20} className="mr-2 text-purple-500" />
            Clinical Pearls
          </h2>
          <div className="space-y-3">
            {caseData.feedback.clinicalPearls.map((pearl, index) => (
              <div key={index} className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">• {pearl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            These teaching notes were generated by ClerkSmart to support your clinical learning journey.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            © {new Date().getFullYear()} ClerkSmart
          </p>
        </div>
      </div>
    </div>
  );
} 