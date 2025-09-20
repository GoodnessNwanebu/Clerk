'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { Department, Subspecialty, DifficultyLevel } from '../../types';
import { Icon } from '../../components/Icon';
import { SubspecialtyModal } from '../../components/modals/SubspecialtyModal';
import { AuthRequiredModal } from '../../components/modals/AuthRequiredModal';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuthCheck } from '../../hooks/useAuthCheck';
import { fetchDepartments, transformDepartmentsForFrontend, hasSubspecialties, getParentDepartment } from '../../lib/services/departmentService';

const DepartmentCard: React.FC<{ department: Department; onClick: () => void; disabled: boolean }> = ({ department, onClick, disabled }) => (
  <div
    onClick={!disabled ? onClick : undefined}
    className={`relative rounded-2xl p-6 text-white overflow-hidden group transition-all duration-300 ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
    } bg-gradient-to-br ${department.gradient}`}
  >
    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-4">
        <Icon name={department.icon} size={40} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white">{department.name}</h3>
      <p className="text-white mt-2">{department.description}</p>
      <div className="flex-grow" />
      <div className="mt-6 flex items-center justify-end text-white/80 group-hover:text-white transition-colors">
        <span className={hasSubspecialties(department.name) ? 'underline' : ''}>
          {hasSubspecialties(department.name) ? 'Choose Subspecialty' : 'Start Case'}
        </span>
        <Icon name={hasSubspecialties(department.name) ? "chevron-right" : "arrow-right"} size={20} className="ml-2" />
      </div>
    </div>
    <div className={`absolute inset-0 bg-black/20 ${!disabled && 'group-hover:bg-black/10'} transition-colors duration-300`}></div>
  </div>
);

const DepartmentSelectionScreen: React.FC = () => {
  const router = useRouter();
  const { generateNewCaseWithDifficulty, isGeneratingCase, setNavigationEntryPoint, departments, isLoadingDepartments } = useAppContext();
  const { isAuthModalOpen, authMessage, hideAuthModal, checkAuthAndExecute } = useAuthCheck();
  const [error, setError] = useState<string | null>(null);
  const [showSubspecialtyModal, setShowSubspecialtyModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedSubspecialties, setSelectedSubspecialties] = useState<Subspecialty[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('standard');
  const [osceMode, setOsceMode] = useState(false);
  const [showOSCEInfoModal, setShowOSCEInfoModal] = useState(false);

  const handleDirectSelect = async (department: Department, subspecialtyName?: string) => {
    setError(null);
    try {
      await generateNewCaseWithDifficulty(department, difficulty, subspecialtyName);
      setNavigationEntryPoint('/departments');
      // Navigate to clerking with OSCE parameter if OSCE mode is enabled
      const clerkingUrl = osceMode ? '/clerking?osce=true' : '/clerking';
      console.log('🚀 [Departments] Navigating to clerking:', {
        osceMode,
        clerkingUrl,
        department: department.name,
        subspecialty: subspecialtyName
      });
      router.push(clerkingUrl);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.startsWith('QUOTA_EXCEEDED')) {
            setError(err.message.split(': ')[1]);
        } else {
            // Show a more user-friendly error message since we have retry logic
            setError("We're having trouble creating a case right now. Please try again in a moment.");
        }
      } else {
         setError("An unknown error occurred. Please try again.");
      }
      console.error(err);
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    if (hasSubspecialties(department.name)) {
      setSelectedDepartment(department);
      setShowSubspecialtyModal(true);
    } else {
      checkAuthAndExecute(() => handleDirectSelect(department), 'Please sign in to create a case');
    }
  };

  const handleMultipleSubspecialtySelect = (subspecialties: Subspecialty[]) => {
    setSelectedSubspecialties(subspecialties);
    
    // Randomly pick one subspecialty from the selected ones
    const randomSubspecialty = subspecialties[Math.floor(Math.random() * subspecialties.length)];
    
    // Get the parent department name for the backend
    const parentDepartmentName = getParentDepartment(randomSubspecialty.name);
    
    const departmentFromSubspecialty: Department = {
      name: parentDepartmentName, // Use parent department name for backend
      icon: randomSubspecialty.icon,
      gradient: randomSubspecialty.gradient,
      description: randomSubspecialty.description,
      avatar: randomSubspecialty.avatar
    };
    
    // Pass the randomly selected subspecialty name to the case generation
    checkAuthAndExecute(() => handleDirectSelect(departmentFromSubspecialty, randomSubspecialty.name), 'Please sign in to create a case');
  };

  return (
    <>
      {/* OSCE Info Modal */}
      {showOSCEInfoModal && (
        <div className="fixed inset-0 bg-black/60 z-50">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Icon name="info" size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">OSCE Mode</h2>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-left space-y-3">
                <p>You'll have 5 minutes to clerk the patient, with the timer starting immediately when the case is created.</p>
                <p>After completing your case, you'll answer 10 follow-up questions to test your clinical reasoning.</p>
              </div>
              <button 
                onClick={() => setShowOSCEInfoModal(false)}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {isGeneratingCase && <LoadingOverlay message="Creating new case..." department={selectedDepartment?.name || 'general'} />}
      <SubspecialtyModal
        isOpen={showSubspecialtyModal}
        onClose={() => setShowSubspecialtyModal(false)}
        department={selectedDepartment!}
        onSelectSubspecialty={() => {}} // Not used in simulation mode
        onSelectMultipleSubspecialties={handleMultipleSubspecialtySelect}
        disabled={isGeneratingCase}
        mode="simulation"
        initialSelections={[]} // Empty for simulation mode - fresh selection each time
      />
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={hideAuthModal}
        message={authMessage}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 transition-colors duration-300">
        <header className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <Icon name="arrow-left" size={24} />
          </button>
          <h1 className="text-2xl font-bold text-center">Choose a Department</h1>
          <div className="w-8"></div>
        </header>
        
        {/* Difficulty Selector */}
        <div className="mb-8 max-w-md mx-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 text-center">
              Case Difficulty Level
            </label>
            <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setDifficulty('standard')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  difficulty === 'standard'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setDifficulty('intermediate')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  difficulty === 'intermediate'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Intermediate
              </button>
              <button
                onClick={() => setDifficulty('difficult')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  difficulty === 'difficult'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Difficult
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              {difficulty === 'standard' && 'Classic textbook presentations'}
              {difficulty === 'intermediate' && 'Realistic complexity with comorbidities'}
              {difficulty === 'difficult' && 'Complex cases with multiple challenges'}
            </p>
          </div>

          {/* OSCE Mode Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">OSCE Mode</span>
                <button 
                  onClick={() => setShowOSCEInfoModal(true)}
                  className="w-4 h-4 rounded-full bg-slate-400 dark:bg-slate-500 flex items-center justify-center text-white text-xs font-bold hover:bg-slate-500 dark:hover:bg-slate-400 transition-colors"
                >
                  <Icon name="info" size={10} />
                </button>
              </div>
              <button
                onClick={() => setOsceMode(!osceMode)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out ${
                  osceMode ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ease-in-out ${
                  osceMode ? 'transform translate-x-5' : ''
                }`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Practice conditions in exam-style stations
            </p>
          </div>
        </div>
        
        <main className="flex flex-col space-y-6 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 max-w-5xl mx-auto">
          {isLoadingDepartments ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading departments...</p>
            </div>
          ) : (
            departments.map((dept) => (
              <DepartmentCard key={dept.name} department={dept} onClick={() => handleDepartmentSelect(dept)} disabled={isGeneratingCase} />
            ))
          )}
        </main>
        {error && (
            <div className="mt-8 text-center bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg max-w-md mx-auto">
                <p>{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                    Retry
                </button>
            </div>
        )}
        
        {!isLoadingDepartments && departments.length === 0 && !error && (
            <div className="mt-8 text-center bg-yellow-900/50 border border-yellow-400 text-yellow-300 px-4 py-3 rounded-lg max-w-md mx-auto">
                <p>No departments available. Please refresh the page.</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm"
                >
                    Refresh
                </button>
            </div>
        )}

      </div>
    </>
  );
};

export default DepartmentSelectionScreen; 