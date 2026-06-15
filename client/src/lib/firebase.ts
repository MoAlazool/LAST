// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAB26QpvSMFey43NgnbhEdg1hmVWipRrw0",
  authDomain: "lecturemate-d0187.firebaseapp.com",
  projectId: "lecturemate-d0187",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lecturemate-d0187.firebasestorage.app",
  messagingSenderId: "236572081094",
  appId: "1:236572081094:web:a109d4ac3e102bd07f90c7",
  measurementId: "G-981T13LPV5"
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

