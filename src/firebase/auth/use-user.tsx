'use client';

import { useFirebase } from '../provider';

// This hook now directly uses the authentication state from the central Firebase provider.
export function useUser() {
    const { user, isUserLoading, userError } = useFirebase();
    return { user, loading: isUserLoading, error: userError };
}
