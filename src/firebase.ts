import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Use anonymous auth to allow secure Firestore access without a login UI
signInAnonymously(auth).catch(err => {
  if (err.code === 'auth/admin-restricted-operation') {
    console.warn("⚠️ Firebase Anonymous Auth is disabled. To fix this:");
    console.warn("1. Go to Firebase Console -> Authentication -> Sign-in method");
    console.warn("2. Enable 'Anonymous' provider.");
    console.warn("Leaderboard and profile sync might be restricted until enabled.");
  } else {
    console.error("Firebase Anonymous Auth failed:", err);
  }
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const handleFirestoreError = (error: any, type: OperationType, path: string) => {
  console.error(`Firestore Error [${type}] ${path}:`, error);
};

export {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  onAuthStateChanged
};
