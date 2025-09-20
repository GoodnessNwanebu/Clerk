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

const PracticeModeScreen: React.FC = () => {
  const router = useRouter();
  const { generatePracticeCase, isGeneratingCase, setNavigationEntryPoint, departments, isLoadingDepartments } = useAppContext();
  const { isAuthModalOpen, authMessage, hideAuthModal, checkAuthAndExecute } = useAuthCheck();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedSubspecialty, setSelectedSubspecialty] = useState<Subspecialty | null>(null);
  const [selectedSubspecialties, setSelectedSubspecialties] = useState<Subspecialty[]>([]);
  const [departmentSubspecialtySelections, setDepartmentSubspecialtySelections] = useState<Record<string, string[]>>({});
  const [inputMode, setInputMode] = useState<'diagnosis' | 'custom'>('diagnosis');
  const [condition, setCondition] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSubspecialtyModal, setShowSubspecialtyModal] = useState(false);
  const [selectedMainDepartment, setSelectedMainDepartment] = useState<Department | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('standard');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [osceMode, setOsceMode] = useState(false);
  const [showOSCEInfoModal, setShowOSCEInfoModal] = useState(false);

  const handleDirectStartPractice = async (department: Department, subspecialtyName?: string) => {
    if (!condition.trim()) {
      setError('Please enter a condition or custom case.');
      return;
    }

    setError(null);
    try {
      // If we have multiple subspecialties selected, randomly pick one
      let finalSubspecialtyName = subspecialtyName;
      if (!finalSubspecialtyName && selectedSubspecialties.length > 0) {
        const randomSubspecialty = selectedSubspecialties[Math.floor(Math.random() * selectedSubspecialties.length)];
        finalSubspecialtyName = randomSubspecialty.name;
      }

      await generatePracticeCase(department, condition.trim(), difficulty, finalSubspecialtyName);
      setNavigationEntryPoint('/practice');
      // Navigate to clerking with OSCE parameter if OSCE mode is enabled
      const clerkingUrl = osceMode ? '/clerking?osce=true' : '/clerking';
      console.log('🚀 [Practice] Navigating to clerking:', {
        osceMode,
        clerkingUrl,
        department: department.name,
        condition: condition.trim(),
        finalSubspecialtyName
      });
      router.push(clerkingUrl);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.startsWith('QUOTA_EXCEEDED')) {
            setError(err.message.split(': ')[1]);
        } else {
            // Check if the error message contains structured error data
            if (err.message.includes('"error"') && err.message.includes('"suggestion"')) {
              try {
                const errorData = JSON.parse(err.message);
                setError(`${errorData.error}\n\n${errorData.suggestion}`);
              } catch {
                // If JSON parsing fails, show a user-friendly message
                setError("We couldn't create your practice case. Please try simplifying your description or using a different approach.");
              }
            } else {
              // For other errors, show a user-friendly message
              setError("We couldn't create your practice case right now. Please try again or simplify your description.");
            }
        }
      } else {
         setError("Something went wrong. Please try again.");
      }
      console.error(err);
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    if (hasSubspecialties(department.name)) {
      setSelectedMainDepartment(department);
      setShowSubspecialtyModal(true);
    } else {
      // For direct departments, set both the main department and selected department
      setSelectedMainDepartment(department);
      setSelectedDepartment(department);
      setSelectedSubspecialty(null); // Clear subspecialty when selecting direct department
    }
    setShowDepartmentDropdown(false);
  };

  const handleMultipleSubspecialtySelect = (subspecialties: Subspecialty[]) => {
    setSelectedSubspecialties(subspecialties);
    
    // Store selections for this department
    if (selectedMainDepartment) {
      setDepartmentSubspecialtySelections(prev => ({
        ...prev,
        [selectedMainDepartment.name]: subspecialties.map(s => s.name)
      }));
    }
    
    // Set the first subspecialty for display purposes, but we'll randomly pick during case generation
    if (subspecialties.length > 0) {
      const firstSubspecialty = subspecialties[0];
      const parentDepartmentName = getParentDepartment(firstSubspecialty.name);
      
      const departmentFromSubspecialty: Department = {
        name: parentDepartmentName, // Use parent department name for backend
        icon: firstSubspecialty.icon,
        gradient: firstSubspecialty.gradient,
        description: firstSubspecialty.description,
        avatar: firstSubspecialty.avatar
      };
      
      setSelectedDepartment(departmentFromSubspecialty);
      setSelectedSubspecialty(firstSubspecialty);
    }
    setShowSubspecialtyModal(false);
  };

  const handleStartPractice = async () => {
    if (!selectedDepartment || !condition.trim()) {
      setError('Please select a department and enter a condition or custom case.');
      return;
    }

    checkAuthAndExecute(async () => {
      await handleDirectStartPractice(selectedDepartment);
    }, 'Please sign in to create a case');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartPractice();
    }
  };

  const getPlaceholderText = () => {
    if (inputMode === 'diagnosis') {
      return "Enter a medical condition to practice...\n\nExamples:\n• Myocardial Infarction\n• Pneumonia";
    } else {
      return "Describe your custom case...\n\nExamples:\n• 45-year-old male with chest pain and shortness of breath\n• 28-year-old pregnant woman with severe headache and visual disturbances";
    }
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
                <p>You'll have 5 minutes to clerk the patient, with the timer starting immediately when the case is created. After completing your case, you'll answer 10 follow-up questions to test your clinical reasoning.</p>
              
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

      {isGeneratingCase && <LoadingOverlay message="Creating practice case..." department={selectedDepartment?.name || 'general'} />}
      <SubspecialtyModal
        isOpen={showSubspecialtyModal}
        onClose={() => setShowSubspecialtyModal(false)}
        department={selectedMainDepartment!}
        onSelectSubspecialty={() => {}} // Not used in practice mode
        onSelectMultipleSubspecialties={handleMultipleSubspecialtySelect}
        disabled={isGeneratingCase}
        mode="practice"
        initialSelections={selectedMainDepartment ? departmentSubspecialtySelections[selectedMainDepartment.name] || [] : []}
      />
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={hideAuthModal}
        message={authMessage}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <Icon name="arrow-left" size={24} />
            </button>
            <h1 className="text-2xl font-bold text-center">Practice Mode</h1>
            <div className="w-8"></div>
          </header>

          <main className="space-y-8">
            {/* Introduction */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Practice Specific Conditions
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Select a department and enter a condition or custom case to practice your clinical skills
              </p>
            </div>

            {/* Department Selection */}
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">
                Select Department
              </label>
              
              {/* Mobile Dropdown */}
              <div className="block sm:hidden">
                <div className="relative">
                  <button
                    onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                    disabled={isGeneratingCase}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                      selectedMainDepartment
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    } ${isGeneratingCase ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
                  >
                    <div className="flex items-center space-x-3">
                      {selectedMainDepartment ? (
                        <Icon name={selectedMainDepartment.icon} size={24} />
                      ) : (
                        <Icon name="building-2" size={24} />
                      )}
                      <div className="text-left">
                        <span className="font-medium">
                          {selectedMainDepartment ? selectedMainDepartment.name : 'Select a department'}
                        </span>
                        {selectedSubspecialty && (
                          <div className="text-sm text-teal-600 dark:text-teal-400">
                            → {selectedSubspecialty.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <Icon 
                      name={showDepartmentDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      className="transition-transform duration-200" 
                    />
                  </button>
                  
                  {showDepartmentDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                      {departments.map((dept) => (
                        <button
                          key={dept.name}
                          onClick={() => handleDepartmentSelect(dept)}
                          disabled={isGeneratingCase}
                          className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                            isGeneratingCase ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon name={dept.icon} size={20} />
                            <span className="font-medium text-left">{dept.name}</span>
                          </div>
                                                     {hasSubspecialties(dept.name) && (
                             <Icon name="chevron-right" size={16} />
                           )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

                             {/* Desktop Grid */}
               <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {departments.map((dept) => {
                   // Only highlight the button if it's the main department that was used for selection
                   const isSelected = selectedMainDepartment?.name === dept.name;
                  
                  return (
                    <button
                      key={dept.name}
                      onClick={() => handleDepartmentSelect(dept)}
                      disabled={isGeneratingCase}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      } ${isGeneratingCase ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon name={dept.icon} size={24} />
                          <div className="text-left">
                            <span className="font-medium">{dept.name}</span>
                            {isSelected && selectedSubspecialty && (
                              <div className="text-sm text-teal-600 dark:text-teal-400">
                                → {selectedSubspecialty.name}
                              </div>
                            )}
                          </div>
                        </div>
                                                 {hasSubspecialties(dept.name) && (
                           <Icon name="chevron-right" size={16} className="ml-auto" />
                         )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Case Difficulty
              </label>
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 max-w-xs">
                <button
                  onClick={() => setDifficulty('standard')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    difficulty === 'standard'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  disabled={isGeneratingCase}
                >
                  Standard
                </button>
                <button
                  onClick={() => setDifficulty('intermediate')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    difficulty === 'intermediate'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  disabled={isGeneratingCase}
                >
                  Intermediate
                </button>
                <button
                  onClick={() => setDifficulty('difficult')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    difficulty === 'difficult'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  disabled={isGeneratingCase}
                >
                  Difficult
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
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

            {/* Input Mode Toggle */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Input Type
              </label>
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 max-w-xs">
                <button
                  onClick={() => setInputMode('diagnosis')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    inputMode === 'diagnosis'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  disabled={isGeneratingCase}
                >
                  Single Diagnosis
                </button>
                <button
                  onClick={() => setInputMode('custom')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    inputMode === 'custom'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  disabled={isGeneratingCase}
                >
                  Custom Case
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {inputMode === 'diagnosis' && 'Enter a specific medical condition to practice'}
                {inputMode === 'custom' && 'Provide a detailed case description with patient details'}
              </p>
            </div>

            {/* Condition/Case Input */}
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">
                {inputMode === 'diagnosis' ? 'Enter Condition' : 'Enter Custom Case'}
              </label>
              <div className="relative">
                <textarea
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getPlaceholderText()}
                  disabled={isGeneratingCase}
                  rows={8}
                  className="w-full p-4 pr-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 resize-none text-base"
                />
                <Icon 
                  name="search" 
                  size={20} 
                  className="absolute right-4 top-4 text-slate-400" 
                />
              </div>

            </div>

            {/* Start Button */}
            <button
              onClick={handleStartPractice}
              disabled={!selectedDepartment || !condition.trim() || isGeneratingCase}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isGeneratingCase ? (
                <>
                  <Icon name="loader-2" size={20} className="animate-spin" />
                  <span>Generating Case...</span>
                </>
              ) : (
                <>
                  <Icon name="play" size={20} />
                  <span>Start Practice</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
                <div className="flex items-start space-x-2">
                  <Icon name="alert-circle" size={20} className="mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {error.split('\n\n').map((part, index) => (
                      <div key={index} className={index === 0 ? 'font-medium' : 'text-sm'}>
                        {part}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
};

export default PracticeModeScreen; 