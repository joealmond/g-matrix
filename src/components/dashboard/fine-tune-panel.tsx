'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, Vote } from '@/lib/types';
import { ProductVibeChart } from './product-vibe-chart';
import { DraggableDot } from './draggable-dot';
import { doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


interface FineTunePanelProps {
  product: Product;
  initialVote: Vote;
  userId?: string;
}

export function FineTunePanel({ product, initialVote, userId }: FineTunePanelProps) {
  const [vibe, setVibe] = useState({
    safety: initialVote.safety,
    taste: initialVote.taste,
  });
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleVibeChange = (newVibe: {
    safety: number;
    taste: number;
  }) => {
    setVibe(newVibe);
  };

  const updateVoteInFirestore = useCallback(async (newVibe: { safety: number; taste: number; }) => {
    if (!firestore || !userId) return;

    const productRef = doc(firestore, 'products', product.id);
    const voteRef = doc(firestore, 'products', product.id, 'votes', userId);
    
    try {
      await runTransaction(firestore, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error("Product not found");
        }

        const productData = productDoc.data() as Product;

        // Calculate new averages
        const oldTotalSafety = (productData.avgSafety * productData.voteCount) - initialVote.safety;
        const oldTotalTaste = (productData.avgTaste * productData.voteCount) - initialVote.taste;
        const newAvgSafety = (oldTotalSafety + newVibe.safety) / productData.voteCount;
        const newAvgTaste = (oldTotalTaste + newVibe.taste) / productData.voteCount;

        transaction.update(productRef, {
            avgSafety: newAvgSafety,
            avgTaste: newAvgTaste,
        });

        transaction.set(voteRef, {
            ...newVibe,
            createdAt: initialVote.createdAt, // Keep original timestamp
            updatedAt: serverTimestamp(),
        }, { merge: true });
      });

    } catch (e: any) {
        console.error("Fine-tune update failed:", e);
        const permissionError = new FirestorePermissionError({
            path: voteRef.path,
            operation: 'update',
            requestResourceData: newVibe
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: e.message || "Could not update your vibe."
        });
    }

  }, [firestore, userId, product.id, initialVote.safety, initialVote.taste, initialVote.createdAt, toast]);

  const debouncedUpdate = useMemo(() => debounce(updateVoteInFirestore, 500), [updateVoteInFirestore]);
  
  useEffect(() => {
    debouncedUpdate(vibe);
    return () => debouncedUpdate.cancel();
  }, [vibe, debouncedUpdate]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Fine-Tune Your Vibe</CardTitle>
        <CardDescription>
          Drag the dot to precisely place this product on the G-Matrix.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <ProductVibeChart />
        <DraggableDot 
            safety={vibe.safety} 
            taste={vibe.taste} 
            onVibeChange={handleVibeChange} 
        />
      </CardContent>
    </Card>
  );
}
