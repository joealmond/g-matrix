'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadDialog } from '@/components/product/image-upload-dialog';
import { useUser } from '@/firebase';

export function DynamicHeaderButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { user, loading } = useUser();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleScanClick = () => {
    setDialogOpen(true);
  };

  if (!hasMounted || loading) {
    // On the server and during initial client render, render a placeholder
    // to prevent layout shifts.
    return <div className="w-[200px] h-10" />;
  }

  const isSpecialPage =
    pathname.startsWith('/vibe-check/') || pathname.startsWith('/product/');

  return (
    <div className="flex items-center gap-4 w-auto justify-end">
      {isSpecialPage ? (
        <Button asChild size="icon" className="md:w-auto md:px-4 md:hidden">
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

      {user ? (
        <Button variant="outline" asChild>
          <Link href="/account">
            <User className="mr-2 h-4 w-4" />
            <span>Account</span>
          </Link>
        </Button>
      ) : (
        <Button variant="outline" asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            <span>Login</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
