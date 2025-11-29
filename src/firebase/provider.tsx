'use client';
import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

type Firebase = {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
};

const FirebaseContext = createContext<Firebase>({
  app: null,
  auth: null,
  firestore: null,
});

export function FirebaseProvider({
  children,
  value,
}: PropsWithChildren<{ value: Firebase }>) {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}

export function useFirebaseApp() {
  const { app } = useFirebase();
  return app;
}

export function useAuth() {
  const { auth } = useFirebase();
  return auth;
}

export function useFirestore() {
  const { firestore } = useFirebase();
  return firestore;
}

export function useMemoFirebase<T>(
  factory: () => T,
  deps: React.DependencyList
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
