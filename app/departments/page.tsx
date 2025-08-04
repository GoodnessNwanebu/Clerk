'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { DEPARTMENTS } from '../../constants';
import { Department, Subspecialty, DifficultyLevel } from '../../types';
import { Icon } from '../../components/Icon';
import { SubspecialtyModal } from '../../components/SubspecialtyModal';
import { LoadingOverlay } from '../../components/LoadingOverlay';

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
        <span className={department.subspecialties ? 'underline' : ''}>
          {department.subspecialties ? 'Choose Subspecialty' : 'Start Case'}
        </span>
        <Icon name={department.subspecialties ? "chevron-right" : "arrow-right"} size={20} className="ml-2" />
      </div>
    </div>
    <div className={`absolute inset-0 bg-black/20 ${!disabled && 'group-hover:bg-black/10'} transition-colors duration-300`}></div>
  </div>
);

const DepartmentSelectionScreen: React.FC = () => {
  const router = useRouter();
  const { generateNewCaseWithDifficulty, isGeneratingCase } = useAppContext();
  const [error, setError] = useState<string | null>(null);
  const [showSubspecialtyModal, setShowSubspecialtyModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('standard');

  const handleDirectSelect = async (department: Department) => {
    setError(null);
    try {
      await generateNewCaseWithDifficulty(department, difficulty);
      router.push('/clerking');
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
    if (department.subspecialties) {
      setSelectedDepartment(department);
      setShowSubspecialtyModal(true);
    } else {
      handleDirectSelect(department);
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
    
    handleDirectSelect(departmentFromSubspecialty);
  };

  return (
    <>
      {isGeneratingCase && <LoadingOverlay message="Creating new case..." department={selectedDepartment?.name || 'general'} />}
      <SubspecialtyModal
        isOpen={showSubspecialtyModal}
        onClose={() => setShowSubspecialtyModal(false)}
        department={selectedDepartment!}
        onSelectSubspecialty={handleSubspecialtySelect}
        disabled={isGeneratingCase}
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
        <div className="mb-8 max-w-md mx-auto">
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
        
        <main className="flex flex-col space-y-6 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 max-w-5xl mx-auto">
          {DEPARTMENTS.map((dept) => (
            <DepartmentCard key={dept.name} department={dept} onClick={() => handleDepartmentSelect(dept)} disabled={isGeneratingCase} />
          ))}
        </main>
        {error && (
            <div className="mt-8 text-center bg-red-900/50 border border-red-400 text-red-300 px-4 py-3 rounded-lg max-w-md mx-auto">
                <p>{error}</p>
            </div>
        )}
      </div>
    </>
  );
};

export default DepartmentSelectionScreen; 