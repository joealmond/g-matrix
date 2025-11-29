'use client';

import { useAuth, useUser } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function AccountPage() {
  const auth = useAuth();
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'Signed In',
        description: 'You have successfully signed in.',
      });
      router.push('/');
    } catch (error) {
      console.error('Sign in error', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Could not sign you in with Google. Please try again.',
      });
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/');
    } catch (error) {
      console.error('Sign out error', error);
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'Could not sign you out. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">
            User Account
          </CardTitle>
          <CardDescription>
            {user
              ? 'Manage your account settings and profile.'
              : 'Sign in to upload images and rate products.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                <AvatarFallback>
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
               <p className="text-muted-foreground">You are not signed in.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {user ? (
            <Button onClick={handleSignOut} className="w-full">
              <LogOut className="mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button onClick={handleSignIn} className="w-full">
              <LogIn className="mr-2" />
              Sign In with Google
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
