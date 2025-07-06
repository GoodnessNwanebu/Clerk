import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Icon } from '../components/Icon';
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
];

const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Ensure the component is fully mounted before animations start
  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      if (typeof window !== 'undefined') {
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
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">{currentStep.description}</p>
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
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 hover:scale-105 transform transition-transform duration-200"
          >
            <span>Continue</span>
            <Icon name="arrow-right" size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default OnboardingScreen;
