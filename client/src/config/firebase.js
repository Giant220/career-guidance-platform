import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAuijA_5r2SkARswubW7_-NlKeDcnHlk1w",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "career-bridge-lesotho.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "career-bridge-lesotho",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "career-bridge-lesotho.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "755865017435",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:755865017435:web:175ea9df56be85e4ddf37e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;