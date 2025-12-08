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
  error: Error | null;
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
  
  // Track the user UID we're currently checking admin for
  const [checkedUid, setCheckedUid] = useState<string | null>(null);

  const adminDocRef = useMemoFirebase(
    () => getAdminDocRef(firestore, user),
    [firestore, user]
  );

  const { data: adminDoc, isLoading: isAdminDocLoading, error, metadata } = useDoc(adminDocRef, { includeMetadataChanges: true });

  // Mark as checked once we get a server result for the current user
  useEffect(() => {
    // Only mark as checked when we have a definitive answer from server (not cache)
    if (user && adminDocRef && !isAdminDocLoading && !metadata?.fromCache) {
      setCheckedUid(user.uid);
    }
  }, [user, adminDocRef, isAdminDocLoading, metadata?.fromCache]);

  // Reset checked state when user changes
  useEffect(() => {
    if (!user || user.uid !== checkedUid) {
      setCheckedUid(null);
    }
  }, [user, checkedUid]);

  // We're loading if:
  // 1. User is still loading
  // 2. OR we have a user but haven't confirmed admin status from server yet
  const hasServerConfirmation = user && checkedUid === user.uid;
  const isLoading = isUserLoading || (!!user && !hasServerConfirmation);
  
  const isRealAdmin = !!adminDoc;
  
  // If viewing as user, hide admin status (but keep isRealAdmin for UI controls)
  const isAdmin = isRealAdmin && !isViewingAsUser;

  return { isAdmin, isRealAdmin, isLoading, error: error || null };
}
