import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { auth } from '../lib/firebase';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsAuthReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        toast.success('Logged out successfully');
      } catch (error) {
        console.error('Logout error', error);
        toast.error('Failed to log out');
      }
    }
  };

  return { isAuthenticated, isAuthReady, handleLogout };
}
