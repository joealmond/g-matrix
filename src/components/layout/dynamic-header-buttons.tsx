'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, User, LogIn, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadDialog } from '@/components/product/image-upload-dialog';
import { useUser, useAuth } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { Skeleton } from '../ui/skeleton';

export function DynamicHeaderButtons() {
  const pathname = usePathname();
  const auth = useAuth();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { user, isUserLoading: userLoading } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const isLoading = userLoading || adminLoading;

  const handleScanClick = () => {
    setDialogOpen(true);
  };
  
  const handleLogout = () => {
    if (auth) {
        auth.signOut();
    }
  }

  if (isLoading) {
    // On the server and during initial client render, render a placeholder
    // to prevent layout shifts.
    return (
        <div className="flex items-center gap-4">
            <Skeleton className="w-32 h-10" />
            <Skeleton className="w-24 h-10" />
        </div>
    );
  }

  const isSpecialPage =
    pathname.startsWith('/vibe-check/') || pathname.startsWith('/product/');

  const renderAuthButton = () => {
    if (user) {
      return (
        <>
          {isAdmin ? (
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin</span>
              </Link>
            </Button>
          ) : (
             <Button variant="outline" asChild>
                <Link href="/">
                    <User className="mr-2 h-4 w-4" />
                    <span>Home</span>
                </Link>
            </Button>
          )}
          <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
          </Button>
        </>
      );
    }
    return (
      <Button variant="outline" asChild>
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" />
          <span>Login</span>
        </Link>
      </Button>
    );
  }

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
        <ImageUploadDialog
          open={isDialogOpen}
          onOpenChange={setDialogOpen}
        >
          <Button onClick={handleScanClick}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Scan Product</span>
          </Button>
        </ImageUploadDialog>
      )}
      
      <div className="flex items-center gap-2">
        {renderAuthButton()}
      </div>
    </div>
  );
}
