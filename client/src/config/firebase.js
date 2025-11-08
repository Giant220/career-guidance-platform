import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Dynamic configuration that works in both dev and production
const getFirebaseConfig = () => {
  // For production (Render) - use environment variables
  if (process.env.NODE_ENV === 'production') {
    return {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };
  }
  
  // For development - use hardcoded values
  return {
    apiKey: "AIzaSyAuijA_5r2SkARswubW7_-NlKeDcnHlk1w",
    authDomain: "career-bridge-lesotho.firebaseapp.com",
    projectId: "career-bridge-lesotho",
    storageBucket: "career-bridge-lesotho.firebasestorage.app",
    messagingSenderId: "755865017435",
    appId: "1:755865017435:web:175ea9df56be85e4ddf37e"
  };
};

const firebaseConfig = getFirebaseConfig();

// Validate config
if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing. Check environment variables.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
