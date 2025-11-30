'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadDialog } from '@/components/product/image-upload-dialog';
import { useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { Skeleton } from '../ui/skeleton';

export function DynamicHeaderButtons() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { user, isUserLoading: userLoading } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const isLoading = userLoading || (user && adminLoading);
  const isAdminPage = pathname.startsWith('/admin');

  const handleScanClick = () => {
    setDialogOpen(true);
  };

  const handleLogout = () => {
    if (auth) {
      auth.signOut().then(() => {
        router.push('/');
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  const renderAuthButtons = () => {
    if (user) {
      return (
        <>
          {isAdmin && !isAdminPage && (
            <Button variant="outline" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </>
      );
    }
    return (
      <Button variant="outline" asChild>
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Link>
      </Button>
    );
  };

  const isSpecialPage =
    pathname.startsWith('/vibe-check/') || pathname.startsWith('/product/') || isAdminPage;

  return (
    <div className="flex items-center gap-4 w-auto justify-end">
      {isSpecialPage ? (
        <Button asChild size="icon" className="md:w-auto md:px-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="sr-only md:not-sr-only">Back to Home</span>
          </Link>
        </Button>
      ) : (
        <ImageUploadDialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={handleScanClick}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Scan Product</span>
          </Button>
        </ImageUploadDialog>
      )}

      <div className="flex items-center gap-2">{renderAuthButtons()}</div>
    </div>
  );
}
