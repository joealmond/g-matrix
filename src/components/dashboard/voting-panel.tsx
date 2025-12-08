'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Flag,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import type { Vote, Product } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import type { ImageAnalysisState } from '@/lib/actions-types';
import { useTranslations } from 'next-intl';


const FireIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 9.5c0 .938-.443 1.75-1.125 2.25-.682.5-1.125 1.5-1.125 2.25M12 7.5c0 1.5-1 3-2 3s-2-1.5-2-3c0-1.5 1-3 2-3s2 1.5 2 3z"/><path d="M10.5 15.5c-1.5-1-2.5-2.5-2.5-4.5 0-2.5 2-5 5-5s5 2.5 5 5c0 2-1 3.5-2.5 4.5"/><path d="M12.5 18.5c-1.294-.97-2-2.36-2-3.5h-1c0 1.5.706 2.53 2 3.5s2 1.5 2 2.5c0 .5-.5 1-1 1s-1-.5-1-1c0-.5.5-1 1-1h1c0 1.105-1.119 2-2.5 2S9.5 21.605 9.5 20.5s1.119-2 2.5-2 2.5.895 2.5 2z"/></svg>;
const MehIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10" /><line x1="8" x2="16" y1="15" y2="15" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>;
const IceIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="M12 2v2.4l-3.3 3.3-2.4 2.4-3.6 3.6L2.7 20l6.1-6.1 3.6-3.6 2.4-2.4L18 4.4V2"/><path d="m21.3 11.4-3.6 3.6-2.4 2.4-3.3 3.3V22h2.4l3.3-3.3 2.4-2.4 3.6-3.6Z"/><path d="M18 4.4 12 10.5l-3.6 3.6L2.7 20"/><path d="m11.4 2.7 6.1 6.1 3.6 3.6L22 18l-6.1-6.1-3.6-3.6L8.4 4.4Z"/></svg>;


type SafetyVote = 'Clean' | 'Sketchy' | 'Wrecked';
type TasteVote = 'Yass' | 'Meh' | 'Pass';

const voteMapping = {
  safety: { 'Clean': 80, 'Sketchy': 50, 'Wrecked': 20 },
  taste: { 'Yass': 80, 'Meh': 50, 'Pass': 20 }
};

interface VotingPanelProps {
  product: Product | null;
  productName: string;
  analysisResult: ImageAnalysisState | null;
  onVibeSubmit?: (vibe: Vote) => void;
}

export function VotingPanel({ product, productName, analysisResult, onVibeSubmit }: VotingPanelProps) {
  const [safetyVote, setSafetyVote] = useState<SafetyVote | null>(null);
  const [tasteVote, setTasteVote] =useState<TasteVote | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const t = useTranslations('VotingPanel');


  const handleSafetyVote = (vote: SafetyVote) => {
    setSafetyVote(current => (current === vote ? null : vote));
  };

  const handleTasteVote = (vote: TasteVote) => {
    setTasteVote(current => (current === vote ? null : vote));
  };
  
  const handleSubmit = async () => {
    if (!safetyVote || !tasteVote || !firestore || !productName || !analysisResult) return;
    
    const userId = `anonymous_${Date.now()}`;
    const productId = productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const productRef = doc(firestore, 'products', productId);

    const voteData: Vote = {
      userId: userId,
      safety: voteMapping.safety[safetyVote],
      taste: voteMapping.taste[tasteVote],
      isRegistered: false, // Anonymous vote
      votedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    runTransaction(firestore, async (transaction) => {
      const productDoc = await transaction.get(productRef);
      
      if (!productDoc.exists()) {
        // --- Create Product ---
        const newProductData = {
            name: productName,
            imageUrl: analysisResult.imageUrl,
            aiAnalysis: analysisResult.aiAnalysis,
            avgSafety: voteData.safety, // First vote sets the average
            avgTaste: voteData.taste,
            voteCount: 1,
            createdAt: serverTimestamp(),
            createdBy: userId,
        };
        transaction.set(productRef, newProductData);
      } else {
        // --- Update Existing Product ---
        const existingProductData = productDoc.data() as Product;
        const oldVoteCount = existingProductData.voteCount || 0;
        const oldAvgSafety = existingProductData.avgSafety || 0;
        const oldAvgTaste = existingProductData.avgTaste || 0;

        const newVoteCount = oldVoteCount + 1;
        const newAvgSafety = ((oldAvgSafety * oldVoteCount) + voteData.safety) / newVoteCount;
        const newAvgTaste = ((oldAvgTaste * oldVoteCount) + voteData.taste) / newVoteCount;
        
        const productUpdateData = {
          voteCount: newVoteCount,
          avgSafety: newAvgSafety,
          avgTaste: newAvgTaste,
        };
        transaction.update(productRef, productUpdateData);
      }

      // Always create a new vote document
      const voteRef = doc(firestore, 'products', productId, 'votes', userId);
      transaction.set(voteRef, voteData);
    })
    .then(() => {
        toast({
            title: t('vibeSubmitted'),
            description: t('vibeSubmittedDesc', { productName }),
        })

        if (onVibeSubmit) {
          onVibeSubmit(voteData as Vote);
        }
    })
    .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: productRef.path,
          operation: 'write', 
          requestResourceData: { vote: voteData },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold text-center">{t('safetyQuestion')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => handleSafetyVote('Clean')}
              className={cn("group h-24 flex-col gap-2 transition-all active:scale-95", safetyVote === 'Clean' ? 'border-green-500 bg-green-500/10' : 'hover:border-green-500 hover:bg-green-500/10')}
            >
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <span className={cn("font-semibold", safetyVote === 'Clean' ? 'text-green-400' : 'group-hover:text-green-400')}>
                {t('clean')}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSafetyVote('Sketchy')}
              className={cn("group h-24 flex-col gap-2 transition-all active:scale-95", safetyVote === 'Sketchy' ? 'border-yellow-500 bg-yellow-500/10' : 'hover:border-yellow-500 hover:bg-yellow-500/10')}
            >
              <ShieldAlert className="h-8 w-8 text-yellow-500" />
              <span className={cn("font-semibold", safetyVote === 'Sketchy' ? 'text-yellow-400' : 'group-hover:text-yellow-400')}>
                {t('sketchy')}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSafetyVote('Wrecked')}
              className={cn("group h-24 flex-col gap-2 transition-all active-scale-95", safetyVote === 'Wrecked' ? 'border-red-500 bg-red-500/10' : 'hover:border-red-500 hover:bg-red-500/10')}
            >
              <ShieldX className="h-8 w-8 text-red-500" />
              <span className={cn("font-semibold", safetyVote === 'Wrecked' ? 'text-red-400' : 'group-hover:text-red-400')}>
                {t('wrecked')}
              </span>
            </Button>
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-center">{t('tasteQuestion')}</h3>
          <div className="grid grid-cols-3 gap-2">
             <Button
              variant="outline"
              onClick={() => handleTasteVote('Yass')}
              className={cn("group h-24 flex-col gap-2 transition-all active:scale-95", tasteVote === 'Yass' ? 'border-primary bg-primary/10' : 'hover:border-primary hover:bg-primary/10')}
            >
              <FireIcon />
              <span className={cn("font-semibold", tasteVote === 'Yass' ? 'text-primary' : 'group-hover:text-primary')}>
                {t('yass')}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTasteVote('Meh')}
              className={cn("group h-24 flex-col gap-2 transition-all active:scale-95", tasteVote === 'Meh' ? 'bg-secondary' : 'hover:bg-secondary/80')}
            >
              <MehIcon />
              <span className={cn("font-semibold", tasteVote === 'Meh' ? 'text-foreground' : 'group-hover:text-foreground')}>
                {t('meh')}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleTasteVote('Pass')}
              className={cn("group h-24 flex-col gap-2 transition-all active:scale-95", tasteVote === 'Pass' ? 'border-destructive bg-destructive/10' : 'hover:border-destructive hover:bg-destructive/10')}
            >
              <IceIcon />
              <span className={cn("font-semibold", tasteVote === 'Pass' ? 'text-destructive' : 'group-hover:text-destructive')}>
                {t('pass')}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
         <Button onClick={handleSubmit} disabled={!safetyVote || !tasteVote} className="w-full">
          {t('submitVibe')}
        </Button>
         <Button variant="link" className="text-muted-foreground w-full">
          <Flag className="mr-2 h-4 w-4" />
          {t('reportProduct')}
        </Button>
      </CardFooter>
    </Card>
  );
}
