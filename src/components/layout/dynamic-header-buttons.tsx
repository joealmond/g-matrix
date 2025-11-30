'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, User, LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadDialog } from '@/components/product/image-upload-dialog';
import { useUser } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';

export function DynamicHeaderButtons() {
  const pathname = usePathname();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { user, loading: userLoading } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleScanClick = () => {
    setDialogOpen(true);
  };

  const isLoading = userLoading || adminLoading;

  if (!hasMounted || isLoading) {
    // On the server and during initial client render, render a placeholder
    // to prevent layout shifts.
    return <div className="w-[200px] h-10" />;
  }

  const isSpecialPage =
    pathname.startsWith('/vibe-check/') || pathname.startsWith('/product/');

  const renderAuthButton = () => {
    if (user) {
      if (isAdmin) {
        return (
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin</span>
            </Link>
          </Button>
        );
      }
      return (
        <Button variant="outline" asChild>
          <Link href="/account">
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </Link>
        </Button>
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

      {renderAuthButton()}
    </div>
  );
}
