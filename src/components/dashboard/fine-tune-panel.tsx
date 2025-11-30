'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState, useCallback }from 'react';
import type { Product, Vote } from '@/lib/types';
import { ProductVibeChart } from './product-vibe-chart';
import { DraggableDot } from './draggable-dot';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from '@/firebase/errors';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface FineTunePanelProps {
  product: Product;
  initialVote: Vote | null;
}

export function FineTunePanel({ product, initialVote }: FineTunePanelProps) {
  const [vibe, setVibe] = useState({
    safety: initialVote?.safety ?? 50,
    taste: initialVote?.taste ?? 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Use a placeholder or anonymous ID since auth is disabled
  const userId = `anonymous_${Date.now()}`;


  const handleVibeChange = (newVibe: {
    safety: number;
    taste: number;
  }) => {
    setVibe(newVibe);
  };

  const handleSliderChange = (type: 'safety' | 'taste', value: number[]) => {
    setVibe(prev => ({...prev, [type]: value[0]}));
  }

  const handleSubmit = useCallback(async () => {
    if (!firestore || !userId) return;
    setIsSubmitting(true);

    const productRef = doc(firestore, 'products', product.id);
    const voteRef = doc(firestore, 'products', product.id, 'votes', userId);

    try {
      await runTransaction(firestore, async transaction => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error('Product not found');
        }

        const productData = productDoc.data() as Product;
        
        let newAvgSafety = vibe.safety;
        let newAvgTaste = vibe.taste;
        let newVoteCount = productData.voteCount || 0;

        if (initialVote && newVoteCount > 0) {
          // Calculate new averages by first removing the initial vote and then adding the new one
          const oldTotalSafety = productData.avgSafety * newVoteCount - initialVote.safety;
          const oldTotalTaste = productData.avgTaste * newVoteCount - initialVote.taste;
          newAvgSafety = (oldTotalSafety + vibe.safety) / newVoteCount;
          newAvgTaste = (oldTotalTaste + vibe.taste) / newVoteCount;
        } else {
          newVoteCount += 1;
          newAvgSafety = ((productData.avgSafety * (newVoteCount -1) ) + vibe.safety) / newVoteCount;
          newAvgTaste = ((productData.avgTaste * (newVoteCount -1) ) + vibe.taste) / newVoteCount;
        }


        transaction.update(productRef, {
          avgSafety: newAvgSafety,
          avgTaste: newAvgTaste,
          voteCount: newVoteCount,
        });

        transaction.set(
          voteRef,
          {
            ...vibe,
            createdAt: initialVote?.createdAt || serverTimestamp(), // Keep original timestamp if it exists
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
      toast({
        title: "Fine-tune complete!",
        description: "Your detailed rating has been saved."
      })
    } catch (e: any) {
      const permissionError = new FirestorePermissionError({
        path: voteRef.path,
        operation: 'write',
        requestResourceData: {
          productUpdate: { avgSafety: '...', avgTaste: '...' },
          voteUpdate: vibe,
        },
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSubmitting(false);
    }
  }, [firestore, userId, product.id, initialVote, vibe, toast, product.avgSafety, product.avgTaste, product.voteCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Fine-Tune Your Vibe</CardTitle>
        <CardDescription>
          Drag the dot or use the sliders to precisely place this product on the G-Matrix.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6 h-[400px]">
          <ProductVibeChart />
          <DraggableDot
            safety={vibe.safety}
            taste={vibe.taste}
            onVibeChange={handleVibeChange}
          />
        </div>
        <div className="space-y-4 pt-4">
            <div>
                <Label htmlFor="safety-slider" className="mb-2 block">Safety: {vibe.safety}%</Label>
                <Slider
                    id="safety-slider"
                    value={[vibe.safety]}
                    onValueChange={(val) => handleSliderChange('safety', val)}
                    max={100}
                    step={1}
                    disabled={isSubmitting}
                />
            </div>
             <div>
                <Label htmlFor="taste-slider" className="mb-2 block">Taste: {vibe.taste}%</Label>
                <Slider
                    id="taste-slider"
                    value={[vibe.taste]}
                    onValueChange={(val) => handleSliderChange('taste', val)}
                    max={100}
                    step={1}
                    disabled={isSubmitting}
                />
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Fine-Tuned Vibe'}
        </Button>
      </CardFooter>
    </Card>
  );
}
