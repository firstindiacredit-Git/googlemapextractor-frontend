import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAntZL8-YIMYI5Fs19kGrccYOR2nIpIWPM",
    authDomain: "extractor-9843e.firebaseapp.com",
    projectId: "extractor-9843e",
    storageBucket: "extractor-9843e.firebasestorage.app",
    messagingSenderId: "1029960130572",
    appId: "1:1029960130572:web:692b0189efa3b22a9d4e29"
  };
  

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 