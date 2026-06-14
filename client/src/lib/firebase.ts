// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABsJutQQyzmfPm4rwiJ1TJiqMOOBcadSs",
  authDomain: "lecturematepr.firebaseapp.com",
  projectId: "lecturematepr",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lecturematepr.appspot.com",
  messagingSenderId: "319579725299",
  appId: "1:319579725299:web:92a6ae847ed2c841c68686",
  measurementId: "G-SJLFJF58DY"
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

