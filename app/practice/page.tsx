'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { DEPARTMENTS } from '../../constants';
import { Department, Subspecialty, DifficultyLevel } from '../../types';
import { Icon } from '../../components/Icon';
import { SubspecialtyModal } from '../../components/SubspecialtyModal';
import { LoadingOverlay } from '../../components/LoadingOverlay';

const PracticeModeScreen: React.FC = () => {
  const router = useRouter();
  const { generatePracticeCase, isGeneratingCase, setNavigationEntryPoint } = useAppContext();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [inputMode, setInputMode] = useState<'diagnosis' | 'custom'>('diagnosis');
  const [condition, setCondition] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSubspecialtyModal, setShowSubspecialtyModal] = useState(false);
  const [selectedMainDepartment, setSelectedMainDepartment] = useState<Department | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('standard');

  const handleDirectStartPractice = async (department: Department) => {
    if (!condition.trim()) {
      setError('Please enter a condition or custom case.');
      return;
    }

    setError(null);
    try {
      await generatePracticeCase(department, condition.trim(), difficulty);
      setNavigationEntryPoint('/practice');
      router.push('/clerking');
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
    if (department.subspecialties) {
      setSelectedMainDepartment(department);
      setShowSubspecialtyModal(true);
    } else {
      // For direct departments, set both the main department and selected department
      setSelectedMainDepartment(department);
      setSelectedDepartment(department);
    }
  };

  const handleSubspecialtySelect = (subspecialty: Subspecialty) => {
    const departmentFromSubspecialty: Department = {
      name: subspecialty.name,
      icon: subspecialty.icon,
      gradient: subspecialty.gradient,
      description: subspecialty.description,
      avatar: subspecialty.avatar
    };
    
    setSelectedDepartment(departmentFromSubspecialty);
  };

  const handleStartPractice = async () => {
    if (!selectedDepartment || !condition.trim()) {
      setError('Please select a department and enter a condition or custom case.');
      return;
    }

    await handleDirectStartPractice(selectedDepartment);
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
      {isGeneratingCase && <LoadingOverlay message="Creating practice case..." department={selectedDepartment?.name || 'general'} />}
      <SubspecialtyModal
        isOpen={showSubspecialtyModal}
        onClose={() => setShowSubspecialtyModal(false)}
        department={selectedMainDepartment!}
        onSelectSubspecialty={handleSubspecialtySelect}
        disabled={isGeneratingCase}
      />
      <div className="min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 transition-colors duration-300">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DEPARTMENTS.map((dept) => {
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
                            {isSelected && selectedDepartment && selectedDepartment.name !== dept.name && (
                              <div className="text-sm text-teal-600 dark:text-teal-400">
                                → {selectedDepartment.name}
                              </div>
                            )}
                          </div>
                        </div>
                        {dept.subspecialties && (
                          <Icon name="chevron-right" size={16} className="ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Selected Subspecialty Display */}
              {selectedDepartment && selectedDepartment.name !== selectedMainDepartment?.name && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon name="check-circle" size={20} className="text-green-600 dark:text-green-400" />
                      <div>
                        <span className="font-medium text-green-800 dark:text-green-200">Selected:</span>
                        <span className="ml-2 font-semibold text-green-900 dark:text-green-100">
                          {selectedDepartment.name}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedDepartment(null);
                        setSelectedMainDepartment(null);
                      }} 
                      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
                      disabled={isGeneratingCase}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                </div>
              )}
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
                  className="w-full p-4 pr-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 resize-none"
                />
                <Icon 
                  name="search" 
                  size={20} 
                  className="absolute right-4 top-4 text-slate-400" 
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {inputMode === 'diagnosis' 
                  ? "Enter any medical condition you'd like to practice. Be specific for better results."
                  : "Describe the case in detail including patient demographics, symptoms, and relevant context."
                }
              </p>
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

            {/* Tips Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2">
                <Icon name="lightbulb" size={20} />
                <span>Tips for Practice Mode</span>
              </h3>
              <ul className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
                {inputMode === 'diagnosis' ? (
                  <>
                    <li>&bull; Be specific with conditions (e.g., &ldquo;Acute Myocardial Infarction&rdquo; vs &ldquo;Heart Problem&rdquo;)</li>
                    <li>&bull; Use medical terminology for more accurate simulations</li>
                    <li>&bull; Practice common OSCE conditions that you need to master</li>
                    <li>&bull; Try different presentations of the same condition</li>
                  </>
                ) : (
                  <>
                    <li>&bull; Include patient demographics (age, gender, occupation)</li>
                    <li>&bull; Describe presenting symptoms and their timeline</li>
                    <li>&bull; Mention relevant past medical history and medications</li>
                    <li>&bull; Add social context that might affect the case</li>
                  </>
                )}
              </ul>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default PracticeModeScreen; 