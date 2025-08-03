'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { getPearlsForDepartment } from '../constants';

interface LoadingOverlayProps {
  message: string;
  department?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, department = 'general' }) => {
  const [currentPearl, setCurrentPearl] = useState<string>('');
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Get department-specific pearls
    const pearls = getPearlsForDepartment(department);
    
    // Set initial pearl
    const randomPearl = pearls[Math.floor(Math.random() * pearls.length)];
    setCurrentPearl(randomPearl);
    setFadeIn(true);

    // Change pearl every 4 seconds
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        const newPearl = pearls[Math.floor(Math.random() * pearls.length)];
        setCurrentPearl(newPearl);
        setFadeIn(true);
      }, 300); // Wait for fade out
    }, 4000);

    return () => clearInterval(interval);
  }, [department]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-6">
      <Icon name="loader-2" size={48} className="animate-spin mb-6" />
      
      <p className="text-lg font-semibold mb-8 text-center">{message}</p>
      
      {/* Medical Pearl */}
      <div className="max-w-md text-center">
        <p className={`text-slate-300 text-base leading-relaxed transition-opacity duration-300 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}>
          "{currentPearl}"
        </p>
      </div>
    </div>
  );
}; 