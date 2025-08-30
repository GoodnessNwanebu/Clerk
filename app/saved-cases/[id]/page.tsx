'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDrag } from '@use-gesture/react';
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
    history: {
      presentingComplaint: string;
      historyOfPresentingIllness: string;
      pastMedicalHistory: string;
      medications: string;
      allergies: string;
      socialHistory: string;
      familyHistory: string;
      reviewOfSystems: string;
    };
    examination: {
      generalExamination: string;
      systemicExamination: string;
      findings: string[];
      rationale: string;
    };
    investigations: {
      requested: string[];
      results: string[];
      rationale: string;
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

type TabType = 'overview' | 'management' | 'feedback' | 'conversation';

export default function CaseReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [caseId, setCaseId] = useState<string>('');
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Tab navigation state
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 3 });
  const [tabsPerView, setTabsPerView] = useState(4);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  // Refs
  const headerRef = useRef<HTMLElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);

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
          // Recalculate header height after case data loads
          setTimeout(() => {
            if (headerRef.current) {
              const height = headerRef.current.offsetHeight;
              setHeaderHeight(height);
            }
          }, 200);
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

  // Calculate responsive tab display
  useEffect(() => {
    const calculateTabsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) return 2; // Mobile
      if (width < 1024) return 3; // Tablet
      return 4; // Desktop
    };

    const updateLayout = () => {
      const newTabsPerView = calculateTabsPerView();
      setTabsPerView(newTabsPerView);
      setVisibleRange({ start: 0, end: newTabsPerView - 1 });
      
      // Update header height with a small delay to ensure DOM is ready
      setTimeout(() => {
        if (headerRef.current) {
          const height = headerRef.current.offsetHeight;
          setHeaderHeight(height);
        }
      }, 100);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

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
    { id: 'overview', label: 'Overview', icon: '' },
    { id: 'management', label: 'Management', icon: 'clipboard-list' },
    { id: 'feedback', label: 'Feedback', icon: '' },
    { id: 'conversation', label: 'Conversation', icon: 'message-circle' },
  ];

  const handleTabNavigation = (direction: 'left' | 'right') => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    if (direction === 'left' && currentIndex > 0) {
      // Move to previous tab
      setActiveTab(tabs[currentIndex - 1].id);
    } else if (direction === 'right' && currentIndex < tabs.length - 1) {
      // Move to next tab
      setActiveTab(tabs[currentIndex + 1].id);
    }
    
    // Update visible range if needed
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < visibleRange.start || newIndex > visibleRange.end) {
      const newStart = Math.max(0, newIndex - Math.floor(tabsPerView / 2));
      const newEnd = Math.min(tabs.length - 1, newStart + tabsPerView - 1);
      setVisibleRange({ start: newStart, end: newEnd });
    }
  };

  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
  const canNavigateLeft = currentIndex > 0;
  const canNavigateRight = currentIndex < tabs.length - 1;

  // Swipe gesture handling
  const bindSwipeGesture = useDrag(
    ({ movement: [mx], direction: [xDir], velocity: [vx], cancel, canceled, first, last }) => {
      if (first) {
        setIsSwiping(true);
        setSwipeProgress(0);
      }
      
      if (last) {
        setIsSwiping(false);
        setSwipeProgress(0);
        
        // Determine final navigation based on swipe distance and velocity
        const swipeDistance = Math.abs(mx);
        const swipeVelocity = Math.abs(vx);
        const threshold = swipeVelocity > 0.5 ? 30 : 50; // Lower threshold for fast swipes
        
        if (swipeDistance > threshold) {
          if (xDir > 0 && canNavigateLeft) {
            // Swipe right to go to previous tab
            handleTabNavigation('left');
          } else if (xDir < 0 && canNavigateRight) {
            // Swipe left to go to next tab
            handleTabNavigation('right');
          }
        }
      }
      
      // Real-time swipe progress for indicator movement
      if (isSwiping) {
        const maxSwipeDistance = 100; // Maximum swipe distance for full progress
        const progress = Math.min(Math.abs(mx) / maxSwipeDistance, 1);
        const direction = xDir > 0 ? -progress : progress; // Negative for left swipe, positive for right
        setSwipeProgress(direction);
      }
    },
    {
      axis: 'x', // Only horizontal swipes
      threshold: 10, // Lower threshold for more responsive feel
      preventDefault: true, // Prevent default scroll behavior
      filterTaps: true, // Ignore taps
    }
  );

  // Ensure active tab is visible
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeIndex < visibleRange.start || activeIndex > visibleRange.end) {
      const newStart = Math.max(0, activeIndex - Math.floor(tabsPerView / 2));
      const newEnd = Math.min(tabs.length - 1, newStart + tabsPerView - 1);
      setVisibleRange({ start: newStart, end: newEnd });
    }
  }, [activeTab, tabsPerView]);

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
      <header 
        ref={headerRef}
        className="bg-white dark:bg-slate-800  border-slate-200 dark:border-slate-700 fixed top-0 left-0 right-0 z-20"
      >
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/saved-cases')} 
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Icon name="arrow-left" size={20} />
            </button>
          </div>
          
          {/* Case Info Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              {/* <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {caseData?.feedback?.diagnosis || caseData?.diagnosis}
              </h1> */}
           
            </div>
            
            {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center space-x-2">
                  <Icon name="calendar" size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {caseData ? formatDate(caseData.completedAt) : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="clock" size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {caseData ? formatTimeSpent(caseData.timeSpent) : ''}
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium self-start sm:self-auto">
                {caseData?.department.name}
              </div>
            </div> */}
          </div>
        </div>
      </header>

      {/* Fixed Tab Navigation */}
      <div 
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 fixed left-0 right-0 z-10"
        style={{ top: `${headerHeight || 180}px` }}
      >

        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center">
            {/* Left Arrow */}
            <button
              onClick={() => handleTabNavigation('left')}
              disabled={!canNavigateLeft}
              className={`p-2 rounded-full transition-all duration-200 ease-in-out ${
                canNavigateLeft 
                  ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-110' 
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Icon name="chevron-left" size={20} className="transition-transform duration-200" />
            </button>

            {/* Tabs Container */}
            <div 
              ref={tabContainerRef}
              {...bindSwipeGesture()}
              className="flex-1 flex justify-center overflow-hidden relative touch-pan-y"
            >
              <div className="flex space-x-1 transition-transform duration-300 ease-out">
                {tabs.slice(visibleRange.start, visibleRange.end + 1).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out flex-1 max-w-[120px] justify-center relative ${
                      activeTab === tab.id
                        ? 'text-teal-600 dark:text-teal-400 scale-105'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-102'
                    }`}
                  >
                    {tab.icon && <Icon name={tab.icon} size={16} className="mr-2 transition-transform duration-200" />}
                    <span className="transition-all duration-200">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Short Snapping Underline */}
              <div 
                className="absolute bottom-0 h-0.5 bg-teal-500 transition-all duration-300 ease-out"
                style={{
                  width: '20px',
                  left: `${
                    ((tabs.findIndex(tab => tab.id === activeTab) - visibleRange.start) * (100 / tabsPerView)) + 
                    ((100 / tabsPerView) / 2) - 10 + // Center the underline (10px = half of 20px width)
                    (swipeProgress * (100 / tabsPerView))
                  }%`
                }}
              />
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => handleTabNavigation('right')}
              disabled={!canNavigateRight}
              className={`p-2 rounded-full transition-all duration-200 ease-in-out ${
                canNavigateRight 
                  ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-110' 
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Icon name="chevron-right" size={20} className="transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        {...bindSwipeGesture()}
        className="max-w-6xl mx-auto px-6 py-8 transition-all duration-250 ease-in-out touch-pan-y"
        style={{ marginTop: `${(headerHeight || 180) + 60}px` }}
      >
        <div className="transition-opacity duration-250 ease-in-out">
          <CaseTabContent
            activeTab={activeTab}
            caseData={caseData}
            formatDate={formatDate}
            formatTimeSpent={formatTimeSpent}
          />
        </div>
      </div>
    </div>
  );
} 