import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  User,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "@/config/firebase";

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  role: "worker" | "customer";
  city: string;
  photoURL?: string;
  phone?: string;
  skills?: string[];
};

type AuthContextType = {
  firebaseUser: User | null;
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

type Props = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: Props) {
  const [firebaseUser, setFirebaseUser] =
    useState<User | null>(null);

  const [user, setUser] =
    useState<AppUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadUser(uid: string) {
    try {
      const docRef = doc(db, "users", uid);

      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setUser(snap.data() as AppUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log(error);
      setUser(null);
    }
  }

  async function refreshUser() {
    if (!firebaseUser) return;

    await loadUser(firebaseUser.uid);
  }

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setFirebaseUser(currentUser);

          if (currentUser) {
            await loadUser(currentUser.uid);
          } else {
            setUser(null);
          }

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  async function logout() {
    await signOut(auth);

    setFirebaseUser(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}