'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { MEDICAL_PEARLS } from '../constants';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  const [currentPearl, setCurrentPearl] = useState<string>('');
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Set initial pearl
    const randomPearl = MEDICAL_PEARLS[Math.floor(Math.random() * MEDICAL_PEARLS.length)];
    setCurrentPearl(randomPearl);
    setFadeIn(true);

    // Change pearl every 4 seconds
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        const newPearl = MEDICAL_PEARLS[Math.floor(Math.random() * MEDICAL_PEARLS.length)];
        setCurrentPearl(newPearl);
        setFadeIn(true);
      }, 300); // Wait for fade out
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-6">
      <Icon name="loader-2" size={48} className="animate-spin mb-6" />
      
      <p className="text-lg font-semibold mb-8 text-center">{message}</p>
      
      {/* Medical Pearl */}
      <div className="max-w-md text-center">
        <div className="mb-3">
          <Icon name="lightbulb" size={24} className="text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-slate-300 uppercase tracking-wide">Medical Pearl</p>
        </div>
        
        <p className={`text-slate-200 text-base leading-relaxed transition-opacity duration-300 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}>
          "{currentPearl}"
        </p>
      </div>
    </div>
  );
}; 