'use client';

import { useUser } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: isUserLoading } = useUser();
  // Use isRealAdmin to allow access even when viewing as user
  const { isRealAdmin, isLoading: isAdminLoading } = useAdmin();
  const router = useRouter();
  const isLoading = isUserLoading || isAdminLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isRealAdmin) {
        router.push('/');
      }
    }
  }, [user, isRealAdmin, isLoading, router]);

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
