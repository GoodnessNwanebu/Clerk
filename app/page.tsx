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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex flex-col p-6 sm:p-8 transition-colors duration-300 relative">
        {/* Settings Button - Top Right */}
        <button 
          onClick={() => setIsSettingsOpen(true)} 
          className="absolute top-5 right-8 p-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 shadow-lg dark:shadow-slate-900/20 hover:shadow-xl dark:hover:shadow-slate-900/30"
          aria-label="Settings"
        >
          <Icon name="settings" size={20} />
        </button>

        <header className="text-center my-16">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-500 text-transparent bg-clip-text">
            ClerkSmart
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3">The intelligent clinical reasoning simulator.</p>
        </header>

        <main className="flex-grow flex flex-col justify-center space-y-8 max-w-lg mx-auto w-full">
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

        {/* Disclaimer Section */}
        <div className="mt-12 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 max-w-lg mx-auto">
            <div className="flex items-start space-x-3">
              <Icon name="info" size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">Important Disclaimer</p>
                <p className="leading-relaxed">
                  All patients are AI-generated to help medical students build confidence and clinical reasoning skills. This tool bridges theory and practice but should never replace real patient interactions or clinical training.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-16">
          {/* Made with love tag */}
          <div className="flex items-center justify-center space-x-2 text-slate-400 dark:text-slate-500 text-sm">
            <span>Made with</span>
            <Icon name="heart" size={14} className="text-red-500 fill-current animate-pulse" />
            <span>for med students</span>
          </div>
        </footer>
      </div>
    </>
  );
} 