import { db } from './src/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Check if user is already logged in somewhere
export const isUserLoggedIn = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // First time user, create document and set loggedIn to true
      await setDoc(userRef, { 
        loggedIn: true,
        lastLogin: new Date().toISOString()
      });
      return false; // No existing login
    }
    
    return userDoc.data().loggedIn === true;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false; // Default to allowing login if there's an error
  }
};

// Set user as logged in
export const setUserLoggedIn = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      loggedIn: true,
      lastLogin: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting login status:', error);
    // If document doesn't exist yet, create it
    if (error.code === 'not-found') {
      await setDoc(userRef, { 
        loggedIn: true,
        lastLogin: new Date().toISOString()
      });
    }
  }
};

// Set user as logged out
export const setUserLoggedOut = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      loggedIn: false,
      lastLogout: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error setting logout status:', error);
  }
};