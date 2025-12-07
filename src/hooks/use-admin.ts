'use client';

import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { User } from 'firebase/auth';

interface UseAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
}

function getAdminDocRef(
  firestore: ReturnType<typeof useFirestore>,
  user: User | null
): DocumentReference | null {
  if (!firestore || !user) return null;
  return doc(firestore, 'roles_admin', user.uid);
}

export function useAdmin(): UseAdminResult {
  const { user, loading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminDocRef = useMemoFirebase(
    () => getAdminDocRef(firestore, user),
    [firestore, user]
  );

  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminDocRef);

  const isLoading = isUserLoading || isAdminDocLoading;
  const isAdmin = !!adminDoc;

  return { isAdmin, isLoading };
}
