import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
  } from "firebase/auth";
  
  import {
    doc,
    setDoc,
    serverTimestamp,
  } from "firebase/firestore";
  
  import { auth, db } from "@/config/firebase";
  
  type RegisterData = {
    name: string;
    email: string;
    password: string;
    role: "customer" | "worker";
  };
  
  export async function registerUser({
    name,
    email,
    password,
    role,
  }: RegisterData) {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
  
    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      name,
      email: email.trim().toLowerCase(),
      role,
      createdAt: serverTimestamp(),
    });
  
    return credential.user;
  }
  
  export async function loginUser(
    email: string,
    password: string
  ) {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
  
    return credential.user;
  }
  
  export async function logoutUser() {
    await signOut(auth);
  }
  
  export async function resetPassword(
    email: string
  ) {
    await sendPasswordResetEmail(
      auth,
      email.trim()
    );
  }