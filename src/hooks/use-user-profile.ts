'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

/**
 * Hook to fetch and subscribe to the current user's profile (gamification data)
 */
export function useUserProfile() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset profile when user changes
    if (userLoading) {
      setLoading(true);
      return;
    }

    if (!user || user.isAnonymous) {
      // No gamification for anonymous users
      setProfile(null);
      setLoading(false);
      return;
    }

    // Subscribe to user profile document
    const userRef = doc(firestore, 'users', user.uid);
    
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({
            points: data.points || 0,
            badges: data.badges || [],
            totalVotes: data.totalVotes || 0,
            newProductVotes: data.newProductVotes || 0,
            storesTagged: data.storesTagged || [],
            gpsVotes: data.gpsVotes || 0,
            lastVoteDate: data.lastVoteDate,
            currentStreak: data.currentStreak || 0,
            longestStreak: data.longestStreak || 0,
          });
        } else {
          // Profile doesn't exist yet (user hasn't voted)
          setProfile({
            points: 0,
            badges: [],
            totalVotes: 0,
            newProductVotes: 0,
            storesTagged: [],
            gpsVotes: 0,
            currentStreak: 0,
            longestStreak: 0,
          });
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching user profile:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userLoading, firestore]);

  return { profile, loading, error, user };
}
