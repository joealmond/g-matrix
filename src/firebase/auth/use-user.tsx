'use client';

import { useEffect, useState } from 'react';
import { type User } from 'firebase/auth';

// Mock user hook since auth is disabled
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Not loading since we aren't fetching

  return { user, loading };
}
