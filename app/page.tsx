'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../components/Icon';
import { SettingsModal } from '../components/SettingsModal';

const ActionCard: React.FC<{ icon: string; title: string; subtitle: string; onClick?: () => void; disabled?: boolean }> = ({ icon, title, subtitle, onClick, disabled }) => {
  const cardClasses = `
    bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 flex items-center space-x-6
    transform transition-all duration-300 shadow-md dark:shadow-none
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-1 cursor-pointer'}
  `;
  
  return (
    <div onClick={!disabled ? onClick : undefined} className={cardClasses}>
      <Icon name={icon} size={32} className={disabled ? 'text-slate-400 dark:text-slate-500' : 'text-teal-400'} />
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex flex-col p-6 sm:p-8 transition-colors duration-300">
        <header className="text-center my-12">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-500 text-transparent bg-clip-text">
            ClerkSmart
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">The intelligent clinical reasoning simulator.</p>
        </header>

        <main className="flex-grow flex flex-col justify-center space-y-6 max-w-lg mx-auto w-full">
          <ActionCard
            icon="play"
            title="Start Simulation"
            subtitle="Begin a new patient case"
            onClick={() => router.push('/departments')}
          />
          <ActionCard
            icon="target"
            title="Practice Mode"
            subtitle="Practice specific conditions"
            onClick={() => router.push('/practice')}
          />
          <ActionCard
            icon="book"
            title="Case History"
            subtitle="Review your past performance"
            disabled
          />
        </main>

        <footer className="text-center mt-12">
          <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-2 mx-auto">
            <Icon name="settings" size={16} />
            <span>Settings</span>
          </button>
        </footer>
      </div>
    </>
  );
} 