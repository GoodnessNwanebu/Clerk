'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AccountValidationProps {
  children: React.ReactNode;
}

export const AccountValidation: React.FC<AccountValidationProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidAccount, setHasValidAccount] = useState(true);

  useEffect(() => {
    const validateAccount = async () => {
      if (status === 'loading' || !session?.user?.email) {
        return;
      }

      setIsValidating(true);

      try {
        // Check if user has a valid account by making a simple API call
        const response = await fetch('/api/auth/validate-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: session.user.email,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          console.log('❌ User account validation failed, signing out...');
          setHasValidAccount(false);
          
          // Sign out the user and redirect to onboarding
          await signOut({ 
            callbackUrl: '/onboarding',
            redirect: true 
          });
        } else {
          console.log('✅ User account validated successfully');
          setHasValidAccount(true);
        }
      } catch (error) {
        console.error('Error validating account:', error);
        // If validation fails, assume the account is invalid and sign out
        setHasValidAccount(false);
        await signOut({ 
          callbackUrl: '/onboarding',
          redirect: true 
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateAccount();
  }, [session, status]);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Validating account...</p>
        </div>
      </div>
    );
  }

  // If account is invalid, don't render children (user will be redirected)
  if (!hasValidAccount) {
    return null;
  }

  return <>{children}</>;
};
