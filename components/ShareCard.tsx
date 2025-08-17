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

  const diagnosisTextSize = getDiagnosisTextSize(shareData.diagnosis);

  return (
    <div 
      className={`w-[1080px] h-[1350px] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${className}`}
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-40 h-40 rounded-full opacity-10"
          style={{
            top: '100px',
            right: '100px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
          }}
        />
        <div 
          className="absolute w-32 h-32 rounded-full opacity-8"
          style={{
            bottom: '200px',
            left: '100px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
          }}
        />
        <div 
          className="absolute h-1 opacity-30"
          style={{
            top: '300px',
            left: '50px',
            width: '200px',
            background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)'
          }}
        />
        <div 
          className="absolute h-1 opacity-30"
          style={{
            top: '300px',
            right: '50px',
            width: '200px',
            background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)'
          }}
        />
      </div>

      {/* Header Section - Fixed at top */}
      <div className="relative z-10 flex-shrink-0 pt-16 pb-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 mb-8">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
              }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 
              className="text-5xl font-bold"
              style={{
                background: 'linear-gradient(90deg, #0d9488 0%, #0f766e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              ClerkSmart
            </h1>
          </div>
          
          <div 
            className="w-32 h-1 mx-auto rounded-full opacity-60"
            style={{
              background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)'
            }}
          />
        </div>
      </div>

      {/* Achievement Section - Fixed size */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
              }}
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          
          <h2 
            className="text-4xl font-bold mb-4 leading-tight"
            style={{ color: '#1f2937' }}
          >
            {shareData.achievementText}
          </h2>
          
          <div 
            className="w-32 h-1 mx-auto rounded-full opacity-60"
            style={{
              background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
            }}
          />
        </div>
      </div>

      {/* Diagnosis Section - FLEXIBLE HERO ELEMENT */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-16 mb-8">
        <div 
          className="rounded-2xl p-12 border flex flex-col justify-center min-h-0"
          style={{
            background: 'linear-gradient(90deg, #f0fdfa 0%, #ccfbf1 100%)',
            borderColor: '#99f6e4'
          }}
        >
          <p 
            className="text-2xl font-medium mb-6 text-center"
            style={{ color: '#4b5563' }}
          >
            Successfully Diagnosed
          </p>
          <h3 
            className={`${diagnosisTextSize} font-bold leading-tight break-words whitespace-normal max-w-full text-center flex-1 flex items-center justify-center`} 
            style={{ color: '#0f766e' }}
          >
            {shareData.diagnosis}
          </h3>
        </div>
      </div>

      {/* Department Section - Fixed at bottom */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#f3f4f6' }}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#4b5563' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span 
              className="text-3xl font-semibold"
              style={{ color: '#374151' }}
            >
              {shareData.department}
            </span>
          </div>
          
          <div 
            className="rounded-xl px-6 py-3 inline-block"
            style={{ backgroundColor: '#f9fafb' }}
          >
            <p 
              className="text-lg font-medium"
              style={{ color: '#4b5563' }}
            >
              🏆 Top 2% of ClerkSmart users this week
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action - Fixed at bottom */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-6">
        <div 
          className="rounded-2xl p-6 shadow-lg"
          style={{
            background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)'
          }}
        >
          <p className="text-2xl font-semibold text-white mb-2 text-center">
            Join thousands of medical students
          </p>
          <p 
            className="text-lg text-center"
            style={{ color: '#ccfbf1' }}
          >
            Practice clinical reasoning with AI-powered cases
          </p>
        </div>
      </div>

      {/* Bottom accent */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2"
        style={{
          background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)'
        }}
      />
    </div>
  );
};
