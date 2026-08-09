import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBxkZnIuJR6wrn0h8aSvn8PMSL4hIKV7F8",
  authDomain: "service-marketplace-10393.firebaseapp.com",
  projectId: "service-marketplace-10393",
  storageBucket: "service-marketplace-10393.firebasestorage.app",
  messagingSenderId: "919098427149",
  appId: "1:919098427149:web:ff3d388e6f05cc54dc9244",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;