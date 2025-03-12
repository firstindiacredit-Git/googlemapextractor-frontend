import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { setUserLoggedOut } from '../../loginStatusService';

function LogoutOnUnload() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) return;

    const handleUnload = async () => {
      try {
        await setUserLoggedOut(user.uid);
      } catch (error) {
        console.error('Error logging out on unload:', error);
      }
    };

    // Add event listener for tab/browser close
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user]);

  return null; // No UI needed
}

export default LogoutOnUnload;