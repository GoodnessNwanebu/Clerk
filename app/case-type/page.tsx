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
    <div 
      className="text-slate-800 dark:text-white flex items-center justify-center p-4 relative bg-slate-50 dark:bg-slate-900 overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='105' viewBox='0 0 80 105'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='death-star' fill='%2364758B' fill-opacity='0.08'%3E%3Cpath d='M20 10a5 5 0 0 1 10 0v50a5 5 0 0 1-10 0V10zm15 35a5 5 0 0 1 10 0v50a5 5 0 0 1-10 0V45zM20 75a5 5 0 0 1 10 0v20a5 5 0 0 1-10 0V75zm30-65a5 5 0 0 1 10 0v50a5 5 0 0 1-10 0V10zm0 65a5 5 0 0 1 10 0v20a5 5 0 0 1-10 0V75zM35 10a5 5 0 0 1 10 0v20a5 5 0 0 1-10 0V10zM5 45a5 5 0 0 1 10 0v50a5 5 0 0 1-10 0V45zm0-35a5 5 0 0 1 10 0v20a5 5 0 0 1-10 0V10zm60 35a5 5 0 0 1 10 0v50a5 5 0 0 1-10 0V45zm0-35a5 5 0 0 1 10 0v20a5 5 0 0 1-10 0V10z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        height: '100vh',
        maxHeight: '100vh'
      }}
    >
      {/* Modal-like container */}
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 relative z-10" style={{ maxHeight: '90vh', overflow: 'auto' }}>
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
