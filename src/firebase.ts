/// <reference types="vite/client" />
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initError: string | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-dab3eae2-2722-48b9-8007-cfa8d114ecf2");
    console.log("Firebase successfully initialized.");
  } catch (err: any) {
    console.error("Firebase initialization failed:", err);
    initError = err instanceof Error ? err.message : String(err);
  }
} else {
  console.warn("Firebase is not fully configured, starting in local/offline sandbox mode.");
}

export { app, auth, db, initError };


