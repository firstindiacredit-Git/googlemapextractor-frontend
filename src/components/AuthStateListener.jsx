import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

function AuthStateListener() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe = null;

    if (user) {
      console.log('Setting up auth state listener for user:', user.uid);
      
      // Get session ID from localStorage
      const mySessionId = localStorage.getItem('sessionId');
      
      if (!mySessionId) {
        console.log('No session ID found in localStorage');
        return;
      }
      
      // Listen for changes to the user document
      const userRef = doc(db, 'users', user.uid);
      
      unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (!docSnapshot.exists()) {
          console.log('User document does not exist');
          return;
        }
        
        const userData = docSnapshot.data();
        console.log('User document updated:', userData);
        
        // If forcedLogout is true and the session ID doesn't match
        if (userData.forcedLogout && userData.sessionId !== mySessionId) {
          console.log('Detected forced logout. My session:', mySessionId, 'Current session:', userData.sessionId);
          
          // Show message and log out
          message.warning('Your account has been logged in on another device');
          
          // Clear localStorage
          localStorage.removeItem('sessionId');
          localStorage.removeItem('deviceFingerprint');
          
          // Sign out
          auth.signOut().then(() => {
            navigate('/login');
          }).catch(error => {
            console.error('Error signing out:', error);
          });
        }
      }, (error) => {
        console.error('Error listening to user document:', error);
      });
    }

    return () => {
      if (unsubscribe) {
        console.log('Unsubscribing from auth state listener');
        unsubscribe();
      }
    };
  }, [user, navigate]);

  return null;
}

export default AuthStateListener;