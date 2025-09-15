'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { Department, DifficultyLevel } from '../../types';
import { Icon } from '../../components/Icon';
import { AuthRequiredModal } from '../../components/modals/AuthRequiredModal';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useAuthCheck } from '../../hooks/useAuthCheck';

const OSCEModeScreen: React.FC = () => {
  const router = useRouter();
  const { generateOSCECase, isGeneratingCase, setNavigationEntryPoint, departments, isLoadingDepartments } = useAppContext();
  const { isAuthModalOpen, authMessage, hideAuthModal, checkAuthAndExecute } = useAuthCheck();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [inputMode, setInputMode] = useState<'diagnosis' | 'custom'>('diagnosis');
  const [condition, setCondition] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('standard');
  const [osceMode, setOsceMode] = useState<'simulation' | 'practice'>('simulation');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);

  const startOSCECaseGeneration = async (department: Department) => {
    try {
      // Generate OSCE case
      await generateOSCECase(department, osceMode, condition);
      
      // Navigate to OSCE clerking page
      router.push('/clerking?mode=osce');
    } catch (err) {
      throw err; // Re-throw to be handled by the calling function
    }
  };

  const handleDirectStartOSCE = async (department: Department) => {
    if (osceMode === 'practice' && !condition.trim()) {
      setError('Please enter a condition or custom case.');
      return;
    }

    setError(null);
    try {
      console.log('Starting OSCE with:', { department, osceMode, condition, difficulty });
      
      // Start OSCE case generation directly
      setNavigationEntryPoint('/osce');
      await startOSCECaseGeneration(department);
    } catch (err) {
      if (err instanceof Error) {
        setError("We couldn't create your OSCE case right now. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error(err);
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setShowDepartmentDropdown(false);
  };

  const handleStartOSCE = async () => {
    if (!selectedDepartment) {
      setError('Please select a department.');
      return;
    }

    if (osceMode === 'practice' && !condition.trim()) {
      setError('Please enter a condition or custom case.');
      return;
    }

    checkAuthAndExecute(async () => {
      await handleDirectStartOSCE(selectedDepartment);
    }, 'Please sign in to create an OSCE case');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartOSCE();
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
      {isGeneratingCase && <LoadingOverlay message="Creating OSCE case..." department={selectedDepartment?.name || 'general'} />}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={hideAuthModal}
        message={authMessage}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 transition-colors duration-300 flex flex-col">
        <div className="max-w-4xl mx-auto flex-1 flex flex-col">
          <header className="flex items-center justify-between mb-8">
            <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <Icon name="arrow-left" size={24} />
            </button>
            <h1 className="text-2xl font-bold text-center">OSCE Practice</h1>
            <div className="w-8"></div>
          </header>

          <main className="flex-1 space-y-8">
            {/* Introduction */}
            <div className="text-center space-y-2">
              
              <p className="text-slate-600 dark:text-slate-400">
                Select a department and configure your OSCE practice session
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
                      selectedDepartment
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    } ${isGeneratingCase ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
                  >
                    <div className="flex items-center space-x-3">
                      {selectedDepartment ? (
                        <Icon name={selectedDepartment.icon} size={24} />
                      ) : (
                        <Icon name="building-2" size={24} />
                      )}
                      <div className="text-left">
                        <span className="font-medium">
                          {selectedDepartment ? selectedDepartment.name : 'Select a department'}
                        </span>
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
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Grid */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dept) => {
                  const isSelected = selectedDepartment?.name === dept.name;
                 
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
                          </div>
                        </div>
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

            {/* OSCE Mode Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                OSCE Mode
              </label>
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 max-w-xs">
                <button
                  onClick={() => setOsceMode('simulation')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    osceMode === 'simulation'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  disabled={isGeneratingCase}
                >
                  Simulation
                </button>
                <button
                  onClick={() => setOsceMode('practice')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    osceMode === 'practice'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  disabled={isGeneratingCase}
                >
                  Practice
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {osceMode === 'simulation' && 'AI-generated random OSCE cases'}
                {osceMode === 'practice' && 'Practice specific conditions or custom scenarios'}
              </p>
            </div>

            {/* Practice Mode Configuration */}
            {osceMode === 'practice' && (
              <>
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
              </>
            )}

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
        
        {/* Fixed Bottom Button */}
        <div className="max-w-4xl mx-auto w-full px-6 pb-6">
          <button
            onClick={handleStartOSCE}
            disabled={!selectedDepartment || (osceMode === 'practice' && !condition.trim()) || isGeneratingCase}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isGeneratingCase ? (
              <>
                <Icon name="loader-2" size={20} className="animate-spin" />
                <span>Generating OSCE Case...</span>
              </>
            ) : (
              <>
                <Icon name="play" size={20} />
                <span>Start Station</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default OSCEModeScreen;
