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
        <span>Start Case</span>
        <Icon name="arrow-right" size={20} className="ml-2" />
      </div>
    </div>
    <div className={`absolute inset-0 bg-black/20 ${!disabled && 'group-hover:bg-black/10'} transition-colors duration-300`}></div>
  </div>
);

const DepartmentSelectionScreen: React.FC = () => {
  const router = useRouter();
  const { generateNewCase, isGeneratingCase } = useAppContext();
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (department: Department) => {
    setError(null);
    try {
      await generateNewCase(department);
      router.push('/clerking');
    } catch (err) {
      if (err instanceof Error) {
        // Check for our custom quota error message
        if (err.message.startsWith('QUOTA_EXCEEDED')) {
            setError(err.message.split(': ')[1]);
        } else {
            setError("Sorry, we couldn't create a new case right now. Please try again.");
        }
      } else {
         setError("An unknown error occurred. Please try again.");
      }
      console.error(err);
    }
  };

  return (
    <>
      {isGeneratingCase && <LoadingOverlay message="Creating new case..." />}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 transition-colors duration-300">
        <header className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <Icon name="arrow-left" size={24} />
          </button>
          <h1 className="text-2xl font-bold text-center">Choose a Department</h1>
          <div className="w-8"></div>
        </header>
        <main className="flex flex-col space-y-6 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 max-w-5xl mx-auto">
          {DEPARTMENTS.map((dept) => (
            <DepartmentCard key={dept.name} department={dept} onClick={() => handleSelect(dept)} disabled={isGeneratingCase} />
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