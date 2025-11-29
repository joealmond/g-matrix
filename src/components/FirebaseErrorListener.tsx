'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This is a client-side component that should be used in a layout or provider.
// It's purpose is to listen for Firestore permission errors and display them
// in a toast and in the Next.js error overlay during development.
export default function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error('Caught Firestore Permission Error:', error.toString());

      if (process.env.NODE_ENV === 'development') {
        // During development, we throw the error to leverage the Next.js error overlay,
        // which provides a much richer debugging experience.
        throw error;
      } else {
        // In production, we'll just show a generic toast notification.
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description: 'You do not have permission to perform this action.',
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  // This component does not render anything to the DOM.
  return null;
}
