import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export const HOUSE_EMAIL = "bintidesigns442@gmail.com";

function env(name: string, fallback: string) {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY", "AIzaSyBvsr0y-ji_VlLO0y2HTOBs1PwZuZfGcdQ"),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN", "bunti-designs.firebaseapp.com"),
  projectId: env("VITE_FIREBASE_PROJECT_ID", "bunti-designs"),
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET", "bunti-designs.firebasestorage.app"),
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID", "564678268643"),
  appId: env("VITE_FIREBASE_APP_ID", "1:564678268643:web:001520db99ea4789bb57d6"),
  measurementId: env("VITE_FIREBASE_MEASUREMENT_ID", "G-LS7HYB7ECW"),
};

export function firebaseReady() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function getFirebaseApp() {
  if (typeof window === "undefined") return null;
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

export function getFirebaseStorage() {
  const instance = getFirebaseApp();
  if (!instance) return null;
  storage ??= getStorage(instance);
  return storage;
}
