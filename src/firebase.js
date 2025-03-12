import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAntZL8-YIMYI5Fs19kGrccYOR2nIpIWPM",
    authDomain: "extractor-9843e.firebaseapp.com",
    projectId: "extractor-9843e",
    storageBucket: "extractor-9843e.firebasestorage.app",
    messagingSenderId: "1029960130572",
    appId: "1:1029960130572:web:692b0189efa3b22a9d4e29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
auth.useDeviceLanguage(); // Set language to device language

// Initialize Firestore
const db = getFirestore(app);

// Configure Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export { auth, googleProvider, db }; 