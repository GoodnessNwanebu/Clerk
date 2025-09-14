'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../components/Icon';

const CaseTypeCard: React.FC<{
  icon: string;
  title: string;
  onClick: () => void;
}> = ({ icon, title, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 group shadow-md hover:shadow-lg"
    >
      <div className="flex items-center space-x-4">
        <Icon name={icon} size={24} className="text-teal-500 group-hover:text-teal-600 transition-colors" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>
    </button>
  );
};

export default function CaseTypePage() {
  const router = useRouter();

  const handleSimulationSelect = () => {
    router.push('/departments');
  };

  const handlePracticeSelect = () => {
    router.push('/practice');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center justify-center p-4 relative">
      {/* Death Star Pattern Background */}
      <div 
        className="absolute inset-0 opacity-5 dark:opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Modal-like container */}
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => router.push('/')} 
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon name="arrow-left" size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Select Case Type</h1>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <CaseTypeCard
            icon="route"
            title="Simulation"
            onClick={handleSimulationSelect}
          />
          
          <CaseTypeCard
            icon="target"
            title="Practice"
            onClick={handlePracticeSelect}
          />
        </div>
      </div>
    </div>
  );
}
