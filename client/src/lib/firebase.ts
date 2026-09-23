// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Values come from VITE_FIREBASE_* env vars (see .env.example); the defaults are this
// project's public web config (not secret — access is enforced by Firestore rules).
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAB26QpvSMFey43NgnbhEdg1hmVWipRrw0",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "lecturemate-d0187.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "lecturemate-d0187",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "lecturemate-d0187.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "236572081094",
  appId: env.VITE_FIREBASE_APP_ID || "1:236572081094:web:a109d4ac3e102bd07f90c7",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-981T13LPV5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore
const db = getFirestore(app);

export { app, analytics, auth, googleProvider, db };

