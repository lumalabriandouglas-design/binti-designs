import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBvsr0y-ji_VlLO0y2HTOBs1PwZuZfGcdQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bunti-designs.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bunti-designs",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bunti-designs.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "564678268643",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:564678268643:web:001520db99ea4789bb57d6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LS7HYB7ECW",
};

export const firebaseProjectId = firebaseConfig.projectId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function firebaseApp() {
  if (typeof window === "undefined") return null;
  app ??= getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export function firebaseAuth() {
  if (typeof window === "undefined") return null;
  const instance = firebaseApp();
  if (!instance) return null;
  auth ??= getAuth(instance);
  return auth;
}
