'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Icon } from '../../components/Icon';
import { useAppContext } from '../../context/AppContext';
import { CountrySelect } from '../../components/CountrySelect';

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
      <div className="h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between p-6 transition-colors duration-300">
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
               <CountrySelect
                 value={selectedCountry}
                 onChange={setSelectedCountry}
                 placeholder="Choose your country..."
               />
             </div>
           )}
        </div>

        <div className="flex-shrink-0 w-full max-w-sm mx-auto pb-8 mb-4">
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
