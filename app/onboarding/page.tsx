'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Icon } from '../../components/Icon';
import { useAppContext } from '../../context/AppContext';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'IN', name: 'India' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'UG', name: 'Uganda' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'PH', name: 'Philippines' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'JO', name: 'Jordan' },
  { code: 'OTHER', name: 'Other' },
];

const onboardingSteps = [
  {
    title: 'Welcome to ClerkSmart',
    description: 'Your intelligent clinical reasoning simulator for medical education.',
    icon: 'award'
  },
  {
    title: 'Personalized Learning',
    description: 'Get culturally relevant cases tailored to your location and learning needs.',
    icon: 'target'
  },
  {
    title: 'Interactive Practice',
    description: 'Practice with AI patients, receive detailed feedback, and improve your clinical skills.',
    icon: 'users'
  },
  {
    title: 'Choose Your Location',
    description: 'Select your country to get culturally appropriate cases and patient contexts.',
    icon: 'map-pin'
  }
];

const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { setUserCountry } = useAppContext();
  const [step, setStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const isCountryStep = step === onboardingSteps.length - 1;
  const canContinue = isCountryStep ? selectedCountry !== '' : true;

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      // Save country selection and onboarding completion
      if (typeof window !== 'undefined') {
        setUserCountry(selectedCountry);
        localStorage.setItem('hasOnboarded', 'true');
      }
      router.push('/');
    }
  };

  const handleBack = () => {
      if (step > 0) {
          setStep(step - 1);
      }
  }

  const currentStep = onboardingSteps[step];

  if (!isReady) {
    return null; // Return nothing during SSR to avoid hydration issues
  }

  return (
    <>
      <Head>
        <title>Welcome to ClerkSmart</title>
      </Head>
      <div className="h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col p-4 sm:p-6 transition-colors duration-300">
        {/* Main content area - takes available space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          {/* Icon container - smaller on mobile */}
          <div className="bg-teal-500/10 p-4 sm:p-6 rounded-full mb-4 sm:mb-6">
              <div className="bg-teal-500/20 p-3 sm:p-5 rounded-full">
                  <Icon name={currentStep.icon} size={32} className="sm:w-12 sm:h-12 text-teal-400" />
              </div>
          </div>
          
          {/* Title - responsive text size */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4 px-2">{currentStep.title}</h1>
          
          {/* Description - responsive margins */}
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-4 sm:mb-6 px-2 text-sm sm:text-base leading-relaxed">
            {currentStep.description}
          </p>
          
          {/* Country selector - only on last step */}
          {isCountryStep && (
            <div className="w-full max-w-sm px-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select your country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors text-sm"
              >
                <option value="">Choose your country...</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Bottom section - fixed at bottom */}
        <div className="flex-shrink-0 w-full max-w-sm mx-auto pb-4 sm:pb-6">
          {/* Progress indicators */}
          <div className="flex justify-center items-center mb-4 sm:mb-6 space-x-2">
              {step > 0 && (
                <button 
                  onClick={handleBack} 
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm px-2 py-1"
                >
                  Back
                </button>
              )}
              <div className="flex-grow flex justify-center items-center space-x-1 sm:space-x-2">
                  {onboardingSteps.map((_, index) => (
                  <div
                      key={index}
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      step === index ? 'w-4 sm:w-6 bg-teal-400' : 'w-1.5 sm:w-2 bg-slate-300 dark:bg-slate-600'
                      }`}
                  />
                  ))}
              </div>
               {step > 0 && <div className="w-8 sm:w-10"></div>}
          </div>
          
          {/* Continue button */}
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={`w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-3 sm:py-4 rounded-xl flex items-center justify-center space-x-2 hover:scale-105 transform transition-transform duration-200 text-sm sm:text-base ${
              !canContinue ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
            }`}
          >
            <span>{step === onboardingSteps.length - 1 ? 'Get Started' : 'Continue'}</span>
            <Icon name="arrow-right" size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

export default OnboardingScreen; 