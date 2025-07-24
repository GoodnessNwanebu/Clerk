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

  const handleWhatsAppClick = () => {
    // Replace with your actual WhatsApp number
    const phoneNumber = '07014573520'; // Change this to your WhatsApp number
    const message = encodeURIComponent('Hi! I have feedback about ClerkSmart...');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

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

        {/* WhatsApp Floating Button */}
        <button 
          onClick={handleWhatsAppClick}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-600/50 shadow-lg hover:shadow-xl transition-all duration-200 z-50 group"
          aria-label="Contact us on WhatsApp"
        >
          <div className="relative">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            {/* Green dot indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
          </div>
          <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
            Feedback & Support
          </span>
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