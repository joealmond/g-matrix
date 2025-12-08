'use client';

import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { User } from 'firebase/auth';
import { useImpersonate } from './use-impersonate';

interface UseAdminResult {
  isAdmin: boolean;
  /** True if the user is actually an admin (ignores impersonation) */
  isRealAdmin: boolean;
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
  const { isViewingAsUser } = useImpersonate();

  const adminDocRef = useMemoFirebase(
    () => getAdminDocRef(firestore, user),
    [firestore, user]
  );

  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminDocRef);

  const isLoading = isUserLoading || isAdminDocLoading;
  const isRealAdmin = !!adminDoc;
  
  // If viewing as user, hide admin status (but keep isRealAdmin for UI controls)
  const isAdmin = isRealAdmin && !isViewingAsUser;

  return { isAdmin, isRealAdmin, isLoading };
}
