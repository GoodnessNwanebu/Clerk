'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../components/Icon';
import Head from 'next/head';

const onboardingSteps = [
  {
    icon: 'stethoscope',
    title: 'Welcome to ClerkSmart',
    description: 'Your personal clinical reasoning simulator. Sharpen your skills with realistic patient encounters.',
  },
  {
    icon: 'message-square',
    title: 'Natural Conversations',
    description: 'Interact with patients using your voice. Ask questions just like you would in a real clinic.',
  },
  {
    icon: 'users',
    title: 'Live Transcription',
    description: 'See your conversation transcribed in real-time, helping you keep track of the patient history.',
  },
  {
    icon: 'award',
    title: 'Clinical Assessment',
    description: 'Formulate a diagnosis, order investigations, and receive instant, educational feedback on your performance.',
  },
  {
    icon: 'globe',
    title: 'Your Location',
    description: 'Help us personalize your cases with culturally relevant patients and regional medical patterns.',
  },
];

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
  { code: 'OTHER', name: 'Other' },
];

const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // Ensure the component is fully mounted before animations start
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
        localStorage.setItem('userCountry', selectedCountry);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between p-6 transition-colors duration-300">
        <div className="flex-grow flex flex-col items-center justify-center text-center">
          <div className="bg-teal-500/10 p-6 rounded-full mb-8">
              <div className="bg-teal-500/20 p-5 rounded-full">
                  <Icon name={currentStep.icon} size={48} className="text-teal-400" />
              </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">{currentStep.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">{currentStep.description}</p>
          
          {isCountryStep && (
            <div className="w-full max-w-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select your country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
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

        <div className="flex-shrink-0 w-full max-w-sm mx-auto">
          <div className="flex justify-center items-center mb-6 space-x-2">
              {step > 0 && <button onClick={handleBack} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Back</button>}
              <div className="flex-grow flex justify-center items-center space-x-2">
                  {onboardingSteps.map((_, index) => (
                  <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                      step === index ? 'w-6 bg-teal-400' : 'w-2 bg-slate-300 dark:bg-slate-600'
                      }`}
                  />
                  ))}
              </div>
               {step > 0 && <div className="w-10"></div>}
          </div>
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={`w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 hover:scale-105 transform transition-transform duration-200 ${
              !canContinue ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
            }`}
          >
            <span>{step === onboardingSteps.length - 1 ? 'Get Started' : 'Continue'}</span>
            <Icon name="arrow-right" size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default OnboardingScreen; 