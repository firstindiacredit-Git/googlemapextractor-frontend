import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getDeviceFingerprint } from './deviceService';

// Generate a unique session ID
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Check if user is already logged in
export const isUserLoggedIn = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    // If user document doesn't exist, user is not logged in
    if (!userDoc.exists()) {
      return {
        isLoggedIn: false
      };
    }

    const userData = userDoc.data();
    
    // If loggedIn flag is not true, user is not logged in
    if (userData.loggedIn !== true) {
      return {
        isLoggedIn: false
      };
    }

    // Get current device fingerprint
    const currentDevice = await getDeviceFingerprint();
    const savedDevice = userData.deviceInfo || {};
    
    // Check if current device matches the saved device
    const isSameDevice = currentDevice.visitorId === savedDevice.visitorId;
    
    return {
      isLoggedIn: true,
      deviceMatch: isSameDevice,
      savedDevice: savedDevice,
      sessionId: userData.sessionId
    };
  } catch (error) {
    console.error('Error checking login status:', error);
    return {
      isLoggedIn: false,
      error: error.message
    };
  }
};

// Set user as logged in on this device
export const setUserLoggedIn = async (userId) => {
  try {
    // Get device info and generate session ID
    const deviceInfo = await getDeviceFingerprint();
    const sessionId = generateSessionId();
    
    // Create/update user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      loggedIn: true,
      deviceInfo: deviceInfo,
      sessionId: sessionId,
      lastLogin: new Date().toISOString(),
      forcedLogout: false
    };
    
    if (!userDoc.exists()) {
      // Create new document
      await setDoc(userRef, userData);
    } else {
      // Update existing document
      await updateDoc(userRef, userData);
    }
    
    // Store session info in localStorage
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('deviceFingerprint', deviceInfo.visitorId);
    
    console.log('User logged in successfully with session ID:', sessionId);
    return true;
  } catch (error) {
    console.error('Error setting user as logged in:', error);
    return false;
  }
};

// Force login on this device (log out other devices)
export const forceLoginOnThisDevice = async (userId) => {
  try {
    // Get device info and generate session ID
    const deviceInfo = await getDeviceFingerprint();
    const sessionId = generateSessionId();
    
    // Update user document
    const userRef = doc(db, 'users', userId);
    
    const userData = {
      loggedIn: true,
      deviceInfo: deviceInfo,
      sessionId: sessionId,
      lastLogin: new Date().toISOString(),
      forcedLogout: true,
      forcedLogoutTime: new Date().toISOString()
    };
    
    await updateDoc(userRef, userData);
    
    // Double-check the update was successful
    const updatedDoc = await getDoc(userRef);
    if (!updatedDoc.exists() || updatedDoc.data().loggedIn !== true) {
      console.error('Failed to update loggedIn status');
      throw new Error('Failed to update login status');
    }
    
    // Store session info in localStorage
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('deviceFingerprint', deviceInfo.visitorId);
    
    console.log('User forced login successfully with session ID:', sessionId);
    return true;
  } catch (error) {
    console.error('Error forcing login:', error);
    throw error; // Re-throw to handle in UI
  }
};

// Set user as logged out
export const setUserLoggedOut = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      loggedIn: false,
      lastLogout: new Date().toISOString(),
      forcedLogout: false
    });
    
    // Clear session info from localStorage
    localStorage.removeItem('sessionId');
    localStorage.removeItem('deviceFingerprint');
    
    console.log('User logged out successfully');
    return true;
  } catch (error) {
    console.error('Error setting user as logged out:', error);
    return false;
  }
};