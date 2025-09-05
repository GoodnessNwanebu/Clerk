'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Icon } from '../../components/Icon';
import { useAppContext } from '../../context/AppContext';
import { CountrySelect } from '../../components/CountrySelect';
import { useSession, signIn } from 'next-auth/react';

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
  },
  {
    title: 'Sign in to Save Progress',
    description: 'Sign in with Google to save your cases and access them across devices.',
    icon: 'user-check'
  }
];

const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { setUserCountry } = useAppContext();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // If user is already authenticated, redirect to home immediately
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('✅ [OnboardingScreen] User already authenticated, redirecting to home');
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasOnboarded', 'true');
      }
      router.push('/');
    }
  }, [session, status, router]);

  const isCountryStep = step === onboardingSteps.length - 2; // Second to last step
  const isSignInStep = step === onboardingSteps.length - 1; // Last step
  const canContinue = isCountryStep ? selectedCountry !== '' : true;

  // Auto-advance if user is already signed in and we're on the sign-in step
  useEffect(() => {
    if (isSignInStep && session && status === 'authenticated') {
      // User is already signed in, automatically complete onboarding
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('hasOnboarded', 'true');
        }
        router.push('/');
      }, 1000); // Small delay to show the success state
    }
  }, [isSignInStep, session, status, router]);

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      // If moving from country step to sign-in step, save the country selection
      if (isCountryStep) {
        // Store country in localStorage for NextAuth signup process
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingUserCountry', selectedCountry);
        }
      }
      setStep(step + 1);
    } else {
      // Final step - complete onboarding
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasOnboarded', 'true');
      }
      router.push('/');
    }
  };

  const handleDotClick = (index: number) => {
    // Allow navigation to any previous step or current step
    if (index <= step) {
      setStep(index);
    }
  };

  const handleBack = () => {
      if (step > 0) {
          setStep(step - 1);
      }
  }

  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const handleSkipSignIn = () => {
    // Skip sign-in and complete onboarding
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasOnboarded', 'true');
    }
    router.push('/');
  };

  const currentStep = onboardingSteps[step];

  if (!isReady) {
    return null; // Return nothing during SSR to avoid hydration issues
  }

  // Show loading while checking authentication status
  if (status === 'loading') {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-teal-400 to-emerald-500 text-transparent bg-clip-text mb-3">
            ClerkSmart
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Checking your session...</p>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }


  return (
    <>
      <Head>
        <title>Welcome to ClerkSmart</title>
      </Head>
      <div
        
        className="min-h-dvh bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-center p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] transition-colors duration-300"
      >
        <div
          
          className="flex flex-col items-center justify-center text-center mx-auto"
          style={{
            transform: `scale(1)`,
            transformOrigin: 'top center',
            willChange: 'transform',
          }}
        >
          <div className="bg-teal-500/10 p-4 sm:p-6 rounded-full mb-6 sm:mb-8">
            <div className="bg-teal-500/20 p-4 sm:p-5 rounded-full">
              <Icon name={currentStep.icon} size={48} className="text-teal-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{currentStep.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6 sm:mb-8">{currentStep.description}</p>

          {isSignInStep && (
            <div className="w-full max-w-sm space-y-4">
              {session ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    {session.user?.image && (
                      <img 
                        src={session.user.image} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {session.user?.name || 'User'}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {session.user?.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ Successfully signed in!
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-lg transition-colors shadow-sm"
                  >
                    <Icon name="chrome" size={20} />
                    <span>Sign in with Google</span>
                  </button>
                  <button
                    onClick={handleSkipSignIn}
                    className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </div>
          )}
          
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

        <div className="w-full max-w-sm mx-auto mt-8">
          <div className="flex justify-center items-center mb-6 space-x-2">
              <div className="flex-grow flex justify-center items-center space-x-2">
                  {onboardingSteps.map((_, index) => (
                  <button
                      onClick={() => handleDotClick(index)}
                      disabled={index > step}
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                      step === index ? 'w-6 bg-teal-400' : 'w-2 bg-slate-300 dark:bg-slate-600'
                      } ${index <= step ? 'cursor-pointer hover:bg-slate-400 dark:hover:bg-slate-500' : 'cursor-not-allowed'}`}
                  />
                  ))}
              </div>
           </div>
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={`w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-3 sm:py-4 rounded-xl flex items-center justify-center space-x-2 hover:scale-105 transform transition-transform duration-200 ${
              !canContinue ? ' cursor-not-allowed hover:scale-100' : ''
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
