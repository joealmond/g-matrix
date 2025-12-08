'use client';

import { useUser } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: isUserLoading } = useUser();
  // Use isRealAdmin to allow access even when viewing as user
  const { isRealAdmin, isLoading: isAdminLoading, error: adminError } = useAdmin();
  const router = useRouter();
  const isLoading = isUserLoading || isAdminLoading;

  // Debug logging
  useEffect(() => {
    console.log('[AdminGuard] State:', { 
      user: user?.uid, 
      isUserLoading, 
      isRealAdmin, 
      isAdminLoading, 
      isLoading,
      adminError
    });
  }, [user, isUserLoading, isRealAdmin, isAdminLoading, isLoading, adminError]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log('[AdminGuard] No user, redirecting to login');
        router.push('/login');
      } else if (!isRealAdmin) {
        if (adminError) {
          console.error('[AdminGuard] Admin check failed with error:', adminError);
          // Optionally stay on page or show error instead of redirecting?
          // For now, let's see the error.
        }
        console.log('[AdminGuard] Not admin, redirecting to home');
        router.push('/');
      }
    }
  }, [user, isRealAdmin, isLoading, router, adminError]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !isRealAdmin) {
    return null;
  }

  return <>{children}</>;
}
