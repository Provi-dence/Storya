// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC9hLtwg7v80haEBoMiLdNDerX1wwysE4I",
  authDomain: "storya-ta-bf5e1.firebaseapp.com",
  projectId: "storya-ta-bf5e1",
  storageBucket: "storya-ta-bf5e1.firebasestorage.app",
  messagingSenderId: "370890007964",
  appId: "1:370890007964:web:19ed41322208a13e32d459",
  measurementId: "G-BRW18Q3GP8"
};

// Initialize Firebase (Safety check para dili mag-doble ug initialize sa Next.js)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// I-export ang auth ug db para magamit nato sa atong tsx components
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);