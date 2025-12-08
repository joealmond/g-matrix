'use client';

import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { User } from 'firebase/auth';
import { useImpersonate } from './use-impersonate';
import { useState, useEffect } from 'react';

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
  
  // Track if we've ever successfully checked admin status for this user
  const [hasCheckedAdmin, setHasCheckedAdmin] = useState(false);

  const adminDocRef = useMemoFirebase(
    () => getAdminDocRef(firestore, user),
    [firestore, user]
  );

  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminDocRef);

  // Reset hasCheckedAdmin when user changes
  useEffect(() => {
    setHasCheckedAdmin(false);
  }, [user?.uid]);

  // Mark as checked once we get a result (loading becomes false with a valid docRef)
  useEffect(() => {
    if (adminDocRef && !isAdminDocLoading) {
      setHasCheckedAdmin(true);
    }
  }, [adminDocRef, isAdminDocLoading]);

  // We're loading if:
  // 1. User is still loading
  // 2. OR we have a user but haven't checked admin status yet
  const isLoading = isUserLoading || (!!user && !hasCheckedAdmin);
  
  const isRealAdmin = !!adminDoc;
  
  // If viewing as user, hide admin status (but keep isRealAdmin for UI controls)
  const isAdmin = isRealAdmin && !isViewingAsUser;

  return { isAdmin, isRealAdmin, isLoading };
}
