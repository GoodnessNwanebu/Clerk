'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../../components/Icon';
import { CaseTabContent } from '../../../components/CaseTabContent';

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
  patientProfile?: {
    age: string;
    occupation: string;
    educationLevel: string;
    gender: string;
  };
  messages: Array<{
    id: string;
    text: string;
    sender: string;
    timestamp: string;
    speakerLabel?: string;
  }>;
  examinationResults: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    value?: string;
    unit?: string;
    findings?: string;
    interpretation?: string;
  }>;
  investigationResults: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    value?: string;
    unit?: string;
    findings?: string;
    interpretation?: string;
  }>;
  feedback?: {
    diagnosis: string;
    clinicalReasoning: string;
    keyLearningPoint: string;
    whatYouDidWell: string[];
    whatCouldBeImproved: string[];
    clinicalPearls: string[];
    missedOpportunities?: Array<{
      opportunity: string;
      clinicalSignificance: string;
    }>;
  };
  caseReport?: {
    id: string;
    patientInfo: {
      age: string;
      gender: string;
      presentingComplaint: string;
      historyOfPresentingIllness: string;
      pastMedicalHistory: string;
      medications: string;
      allergies: string;
      socialHistory: string;
      familyHistory: string;
    };
    examination: {
      generalExamination: string;
      systemicExamination: string;
      findings: string[];
    };
    investigations: {
      requested: string[];
      results: string[];
    };
    assessment: {
      differentialDiagnosis: string[];
      finalDiagnosis: string;
      reasoning: string;
    };
    management: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
      followUp: string;
    };
    learningPoints: string[];
  };
}

type TabType = 'overview' | 'patient' | 'examination' | 'investigations' | 'assessment' | 'management' | 'feedback' | 'conversation';

export default function CaseReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [caseId, setCaseId] = useState<string>('');
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: 'file-text' },
    { id: 'patient', label: 'Patient Info', icon: 'user' },
    { id: 'examination', label: 'Examination', icon: 'stethoscope' },
    { id: 'investigations', label: 'Investigations', icon: 'microscope' },
    { id: 'assessment', label: 'Assessment', icon: 'brain' },
    { id: 'management', label: 'Management', icon: 'clipboard-list' },
    { id: 'feedback', label: 'Feedback', icon: 'message-square' },
    { id: 'conversation', label: 'Conversation', icon: 'message-circle' },
  ];

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
        <div className="max-w-6xl mx-auto px-6 py-6">
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
                {caseData.feedback?.diagnosis || caseData.diagnosis}
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

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-24 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <CaseTabContent
          activeTab={activeTab}
          caseData={caseData}
          formatDate={formatDate}
          formatTimeSpent={formatTimeSpent}
        />
      </div>
    </div>
  );
} 