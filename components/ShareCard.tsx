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
      className={`w-[1080px] h-[1350px] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative ${className}`}
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
      }}
    >
      {/* Background decorative elements - positioned exactly like original */}
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
      </div>

      {/* Header Section - Fixed at top with proper alignment */}
      <div className="relative z-10 flex-shrink-0 pt-16 pb-8">
        <div className="text-center">
          <div className="text-center mb-8">
            <h1 
              className="text-6xl font-bold block mb-4"
              style={{
                color: '#0d9488'
              }}
            >
              ClerkSmart
            </h1>
          </div>
        </div>
      </div>

      {/* Achievement Section - Fixed size with proper alignment */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
              }}
            >
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          
          <h2 
            className="text-5xl font-bold mb-4 leading-tight"
            style={{ color: '#1f2937' }}
          >
            {shareData.achievementText}
          </h2>
        </div>
      </div>

      {/* Diagnosis Section - Contained rounded rectangle */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-16 mb-8">
        <div className="flex justify-center">
          <div 
            className="rounded-2xl p-12 flex flex-col justify-center min-h-0 max-w-4xl w-full"
            style={{
              background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)'
            }}
          >
            <p 
              className="text-3xl font-bold mb-6 text-center"
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
      </div>

      {/* Department Section - Fixed at bottom with proper alignment */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-8">
        <div className="text-center">
          <div className="text-center mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: '#f3f4f6' }}
            >
              <svg 
                className="w-8 h-8" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#4b5563' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span 
              className="text-4xl font-semibold block"
              style={{ color: '#374151' }}
            >
              {shareData.department}
            </span>
          </div>
          
          <div 
            className="rounded-xl px-6 py-3 inline-block border relative z-20 shadow-sm"
            style={{ 
              backgroundColor: '#9ca3af',
              borderColor: '#6b7280'
            }}
          >
            <p 
              className="text-xl font-medium"
              style={{ color: '#ffffff' }}
            >
              🏆 Top 2% of ClerkSmart users this week
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action - Contained rounded rectangle */}
      <div className="relative z-10 flex-shrink-0 px-16 mb-6">
        <div className="flex justify-center">
          <div 
            className="rounded-2xl p-6 shadow-lg max-w-4xl w-full"
            style={{
              background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)'
            }}
          >
            <p className="text-3xl font-semibold text-white mb-2 text-center">
              Join thousands of medical students
            </p>
            <p 
              className="text-xl text-center"
              style={{ color: '#ccfbf1' }}
            >
              Practice clinical reasoning with AI-powered cases
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
