'use client';
import { useMemo, type PropsWithChildren } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from '.';

export function FirebaseClientProvider(props: PropsWithChildren) {
  const { app, auth, db } = useMemo(() => {
    const { app, auth, db } = initializeFirebase();
    return { app, auth, db };
  }, []);

  return (
    <FirebaseProvider value={{ app, auth, firestore: db }}>
      {props.children}
    </FirebaseProvider>
  );
}
