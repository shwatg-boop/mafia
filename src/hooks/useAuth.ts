import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setDisplayName(data.displayName || currentUser.displayName || 'Player');
          } else {
            const initialName = currentUser.displayName || 'Player';
            setDisplayName(initialName);
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              displayName: initialName,
              photoURL: currentUser.photoURL || '',
              gamesPlayed: 0,
              gamesWon: 0,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // If error is permission or other, fallback to auth displayName
          setDisplayName(currentUser.displayName || 'Player');
        }
      } else {
        setDisplayName('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setAuthError(msg);
      console.error('Google Sign-in error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const updatePlayerName = async (newName: string) => {
    const trimmed = newName.trim().slice(0, 30);
    if (!trimmed || !user) return;
    setDisplayName(trimmed);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          displayName: trimmed,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  return {
    user,
    loading,
    authError,
    displayName,
    loginWithGoogle,
    logout,
    updatePlayerName,
  };
}
