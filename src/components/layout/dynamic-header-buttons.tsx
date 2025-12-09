'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, LogIn, LogOut, User, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadDialog } from '@/components/product/image-upload-dialog';
import { useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { ScoutCard } from '@/components/profile/scout-card';
import LocaleSwitcher from './LocaleSwitcher';
import { useTranslations } from 'next-intl';

export function DynamicHeaderButtons() {
  const t = useTranslations('DynamicHeaderButtons');
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { user, loading: userLoading } = useUser();
  const { isAdmin, isRealAdmin, isLoading: adminLoading } = useAdmin();
  const { profile, loading: profileLoading } = useUserProfile();
  const { coords, error: geoError, requestLocation } = useGeolocation();

  const isLoading = userLoading || (user && adminLoading);
  const isAdminPage = pathname.startsWith('/admin') || pathname.startsWith('/hu/admin') || pathname.startsWith('/en/admin');
  
  // Location status: granted (has coords), denied (has error), or unknown
  const hasLocation = !!coords;
  const locationDenied = !!geoError;

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
      const isAnonymous = user.isAnonymous;
      return (
        <>
          {/* Scout Points badge - only for registered users with points */}
          {!isAnonymous && profile && profile.points > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold text-yellow-500">{profile.points}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <ScoutCard profile={profile} />
              </PopoverContent>
            </Popover>
          )}
          {/* User avatar - show photo for Google users, generic icon for anonymous */}
          <Avatar className="h-8 w-8">
            {!isAnonymous && user.photoURL ? (
              <AvatarImage src={user.photoURL} alt="User" />
            ) : null}
            <AvatarFallback className="bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
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
        {/* Location button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={requestLocation}
          title={hasLocation ? t('locationEnabled') : t('enableLocation')}
          className={hasLocation ? 'text-green-500' : locationDenied ? 'text-red-500' : ''}
        >
          <MapPin className="h-4 w-4" />
        </Button>
        <LocaleSwitcher />
        {renderAuthButtons()}
      </div>
    </div>
  );
}

