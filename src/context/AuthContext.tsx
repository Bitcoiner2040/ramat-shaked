import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db, googleProvider } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserData {
  name: string;
  email: string;
  photoURL: string;
  role: 'customer' | 'admin';
  loyalty_stamps: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserData;
            // Auto-grant admin to specific email for demo purposes
            if (currentUser.email === 'oriperetz1998@gmail.com' && data.role !== 'admin') {
               await setDoc(userRef, { ...data, role: 'admin' }, { merge: true });
               data.role = 'admin';
            }
            setUserData(data);
          } else {
            const newUserData: UserData = {
              name: currentUser.displayName || 'User',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              role: currentUser.email === 'oriperetz1998@gmail.com' ? 'admin' : 'customer',
              loyalty_stamps: 0,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
          }
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Fallback: still allow app to load even if user data fetch fails
        // This prevents the blank screen issue
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
