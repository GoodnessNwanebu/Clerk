'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { DEPARTMENTS } from '../../constants';
import { Department } from '../../types';
import { Icon } from '../../components/Icon';

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
        <Icon name="loader-2" size={48} className="animate-spin mb-4" />
        <p className="text-lg font-semibold">{message}</p>
    </div>
);

const PracticeModeScreen: React.FC = () => {
  const router = useRouter();
  const { generatePracticeCase, isGeneratingCase } = useAppContext();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [condition, setCondition] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartPractice = async () => {
    if (!selectedDepartment || !condition.trim()) {
      setError('Please select a department and enter a condition.');
      return;
    }

    setError(null);
    try {
      await generatePracticeCase(selectedDepartment, condition.trim());
      router.push('/clerking');
    } catch (err) {
      if (err instanceof Error) {
        // Check for our custom quota error message
        if (err.message.startsWith('QUOTA_EXCEEDED')) {
            setError(err.message.split(': ')[1]);
        } else {
            setError("Sorry, we couldn't create a practice case right now. Please try again.");
        }
      } else {
         setError("An unknown error occurred. Please try again.");
      }
      console.error(err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartPractice();
    }
  };

  return (
    <>
      {isGeneratingCase && <LoadingOverlay message="Creating practice case..." />}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <button 
              onClick={() => router.push('/')} 
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Icon name="arrow-left" size={24} className="text-slate-600 dark:text-slate-400" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Practice Mode</h1>
            <div className="w-8"></div>
          </header>

          {/* Main Content */}
          <main className="space-y-8">
            {/* Introduction */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Practice Specific Conditions
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Select a department and enter a specific condition to practice your clinical skills
              </p>
            </div>

            {/* Department Selection */}
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">
                Select Department
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.name}
                    onClick={() => setSelectedDepartment(dept)}
                    disabled={isGeneratingCase}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedDepartment?.name === dept.name
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    } ${isGeneratingCase ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name={dept.icon} size={24} />
                      <span className="font-medium">{dept.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Input */}
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-700 dark:text-slate-300">
                Enter Condition
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Myocardial Infarction, Pneumonia, Pre-eclampsia..."
                  disabled={isGeneratingCase}
                  className="w-full p-4 pr-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                />
                <Icon 
                  name="search" 
                  size={20} 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" 
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter any medical condition you'd like to practice. Be specific for better results.
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
                <div className="flex items-center space-x-2">
                  <Icon name="alert-circle" size={20} />
                  <span>{error}</span>
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
                <li>• Be specific with conditions (e.g., "Acute Myocardial Infarction" vs "Heart Problem")</li>
                <li>• Use medical terminology for more accurate simulations</li>
                <li>• Practice common OSCE conditions that you need to master</li>
                <li>• Try different presentations of the same condition</li>
              </ul>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default PracticeModeScreen; 