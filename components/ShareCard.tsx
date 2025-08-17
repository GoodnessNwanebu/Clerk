import React from 'react';
import { ShareCardProps } from '../types/share';

export const ShareCard: React.FC<ShareCardProps> = ({ shareData, className = '' }) => {
  // Fixed text sizes based on diagnosis length - absolute values for consistent results
  const getDiagnosisTextSize = (diagnosis: string) => {
    if (diagnosis.length > 80) return 'text-2xl'; // Very long - still readable
    if (diagnosis.length > 50) return 'text-3xl'; // Long
    if (diagnosis.length > 30) return 'text-4xl'; // Medium
    return 'text-5xl'; // Short - very prominent
  };

  // Note: getDepartmentIcon function is available for future use
  // const getDepartmentIcon = (department: string) => {
  //   const dept = department.toLowerCase();
  //   if (dept.includes('cardiology') || dept.includes('heart')) return 'heart';
  //   if (dept.includes('neurology') || dept.includes('brain')) return 'brain';
  //   if (dept.includes('pediatrics') || dept.includes('child')) return 'baby';
  //   if (dept.includes('surgery') || dept.includes('scissors')) return 'scissors';
  //   if (dept.includes('obstetrics') || dept.includes('pregnancy')) return 'user';
  //   if (dept.includes('gynecology') || dept.includes('female')) return 'venus';
  //   if (dept.includes('internal') || dept.includes('medicine')) return 'stethoscope';
  //   return 'stethoscope';
  // };

  const diagnosisTextSize = getDiagnosisTextSize(shareData.diagnosis);

  return (
    <div className={`w-[1080px] h-[1350px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col ${className}`}>
      {/* Background with subtle gradient */}
      <svg width="1080" height="1350" className="absolute inset-0">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <rect width="1080" height="1350" fill="url(#bgGradient)" />
        
        {/* Subtle geometric accents */}
        <circle cx="900" cy="200" r="80" fill="url(#accentGradient)" opacity="0.1" />
        <circle cx="150" cy="1150" r="60" fill="url(#accentGradient)" opacity="0.08" />
        <rect x="50" y="300" width="200" height="2" fill="url(#accentGradient)" opacity="0.3" />
        <rect x="830" y="300" width="200" height="2" fill="url(#accentGradient)" opacity="0.3" />
      </svg>

      {/* Header Section - Fixed at top */}
      <div className="relative z-10 flex-shrink-0 pt-16 pb-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              ClerkSmart
            </h1>
          </div>
          
          <div className="w-32 h-1 bg-gradient-to-r from-teal-500 to-teal-600 mx-auto rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Achievement Section - Fixed size */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            {shareData.achievementText}
          </h2>
          
          <div className="w-32 h-1 bg-gradient-to-r from-amber-400 to-amber-500 mx-auto rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Diagnosis Section - FLEXIBLE HERO ELEMENT */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-16 mb-8">
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl p-12 border border-teal-200 flex flex-col justify-center min-h-0">
          <p className="text-2xl font-medium text-gray-600 mb-6 text-center">Successfully Diagnosed</p>
          <h3 className={`${diagnosisTextSize} font-bold text-teal-700 leading-tight break-words whitespace-normal max-w-full text-center flex-1 flex items-center justify-center`}>
            {shareData.diagnosis}
          </h3>
        </div>
      </div>

      {/* Department Section - Fixed at bottom */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-3xl font-semibold text-gray-700">{shareData.department}</span>
          </div>
          
          <div className="bg-gray-50 rounded-xl px-6 py-3 inline-block">
            <p className="text-lg font-medium text-gray-600">🏆 Top 2% of ClerkSmart users this week</p>
          </div>
        </div>
      </div>

      {/* Call to Action - Fixed at bottom */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-6">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 shadow-lg">
          <p className="text-2xl font-semibold text-white mb-2 text-center">
            Join thousands of medical students
          </p>
          <p className="text-teal-100 text-lg text-center">
            Practice clinical reasoning with AI-powered cases
          </p>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 to-teal-600"></div>
    </div>
  );
};
