'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AccountValidationProps {
  children: React.ReactNode;
}

export const AccountValidation: React.FC<AccountValidationProps> = ({ children }) => {
  const { data: session, status } = useSession();

  useEffect(() => {
    const validateAccount = async () => {
      // Only validate if user is authenticated and we have their email
      if (status !== 'authenticated' || !session?.user?.email) {
        return;
      }

      try {
        // Validate account in the background without blocking UI
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
          
          // Sign out the user and redirect to onboarding
          await signOut({ 
            callbackUrl: '/onboarding',
            redirect: true 
          });
        } else {
          console.log('✅ User account validated successfully');
        }
      } catch (error) {
        console.error('Error validating account:', error);
        // If validation fails, assume the account is invalid and sign out
        await signOut({ 
          callbackUrl: '/onboarding',
          redirect: true 
        });
      }
    };

    // Run validation in background without blocking UI
    validateAccount();
  }, [session, status]);

  // Always render children optimistically - validation happens in background
  return <>{children}</>;
};
