'use client';

import { useState } from 'react';
import { type User } from 'firebase/auth';

// Mock user hook since auth is disabled
export function useUser() {
  const [user] = useState<User | null>(null);
  const [loading] = useState(false); // Not loading since we aren't fetching

  return { user, loading };
}
