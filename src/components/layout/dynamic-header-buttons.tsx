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
import LocaleSwitcher from './LocaleSwitcher';
import { useTranslations } from 'next-intl';

export function DynamicHeaderButtons() {
  const t = useTranslations('DynamicHeaderButtons');
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { user, loading: userLoading } = useUser();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  const isLoading = userLoading || (user && adminLoading);
  const isAdminPage = pathname.startsWith('/admin');

  const handleScanClick = () => {
    setDialogOpen(true);
  };

  const handleLogout = () => {
    if (auth) {
      // First, navigate to the root path.
      router.push('/');
      // Then, sign out. The onAuthStateChanged listener will update the UI,
      // but the user will already be on the public homepage.
      auth.signOut();
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
              <Link href="/admin">{t('admin')}</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout} title={t('logout')}>
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      );
    }
    return (
      <Button variant="outline" size="icon" asChild title={t('login')}>
        <Link href="/login">
          <LogIn className="h-4 w-4" />
        </Link>
      </Button>
    );
  };

  const isSpecialPage =
    pathname.startsWith('/vibe-check/') || pathname.startsWith('/product/') || isAdminPage;

  return (
    <div className="flex items-center gap-4 w-auto justify-end">
      {isSpecialPage ? (
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>{t('backToHome')}</span>
          </Link>
        </Button>
      ) : (
        <ImageUploadDialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={handleScanClick}>
            <Upload className="mr-2 h-4 w-4" />
            <span>{t('scanProduct')}</span>
          </Button>
        </ImageUploadDialog>
      )}

      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        {renderAuthButtons()}
      </div>
    </div>
  );
}
