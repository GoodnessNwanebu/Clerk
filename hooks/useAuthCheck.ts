import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface UseAuthCheckReturn {
  isAuthModalOpen: boolean;
  authMessage: string;
  showAuthModal: (message: string) => void;
  hideAuthModal: () => void;
  checkAuthAndExecute: (callback: () => void, message: string) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuthCheck = (): UseAuthCheckReturn => {
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const isAuthenticated = status === 'authenticated' && !!session;
  const isLoading = status === 'loading';

  const showAuthModal = (message: string) => {
    setAuthMessage(message);
    setIsAuthModalOpen(true);
  };

  const hideAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthMessage('');
  };

  const checkAuthAndExecute = (callback: () => void, message: string) => {
    if (isAuthenticated) {
      callback();
    } else {
      showAuthModal(message);
    }
  };

  return {
    isAuthModalOpen,
    authMessage,
    showAuthModal,
    hideAuthModal,
    checkAuthAndExecute,
    isAuthenticated,
    isLoading,
  };
};
