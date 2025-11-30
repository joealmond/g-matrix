'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase/auth/use-user';
import { useEffect } from 'react';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.35 11.1H12.18v2.8h4.99c-.3 1.45-1.7 3.1-4.99 3.1-2.97 0-5.4-2.44-5.4-5.4s2.43-5.4 5.4-5.4c1.45 0 2.47.63 3.05 1.2l2.2-2.2C16.96 3.24 14.8 2 12.18 2c-4.97 0-9 4.03-9 9s4.03 9 9 9c5.3 0 8.5-3.6 8.5-8.85c0-.7-.07-1.35-.15-2.05h-.18Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      router.push('/account');
    }
  }, [user, router]);


  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      })
      router.push('/account');
    } catch (error) {
      console.error('Error during sign-in:', error);
       toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Could not sign you in with Google. Please try again.",
      })
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">
            Sign In
          </CardTitle>
          <CardDescription>
            Sign in with Google to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleSignIn} className="w-full">
            <GoogleIcon />
            <span>Sign in with Google</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
