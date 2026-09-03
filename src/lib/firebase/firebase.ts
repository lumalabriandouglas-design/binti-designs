import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export const HOUSE_EMAIL = "bintidesigns442@gmail.com";

function env(name: string) {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY"),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: env("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: env("VITE_FIREBASE_APP_ID"),
  measurementId: env("VITE_FIREBASE_MEASUREMENT_ID"),
};

export function firebaseReady() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp() {
  if (typeof window === "undefined" || !firebaseReady()) return null;
  app ??= getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth() {
  const instance = getFirebaseApp();
  if (!instance) return null;
  auth ??= getAuth(instance);
  return auth;
}

export function getFirebaseDb() {
  const instance = getFirebaseApp();
  if (!instance) return null;
  db ??= getFirestore(instance);
  return db;
}
