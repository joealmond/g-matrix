'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useRef, useTransition, useCallback } from 'react';
import { VotingPanel } from '@/components/dashboard/voting-panel';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Product, Vote } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FineTunePanel } from '@/components/dashboard/fine-tune-panel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { ImageAnalysisState } from '@/lib/actions-types';
import { useTranslations } from 'next-intl';
import { checkProductExists } from '@/app/actions';

export default function VibeCheckPage() {
  const t = useTranslations('VibeCheck');
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisState | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [showFineTune, setShowFineTune] = useState(false);
  const [latestVote, setLatestVote] = useState<Vote | null>(null);
  const fineTuneRef = useRef<HTMLDivElement>(null);
  
  const [manualProductName, setManualProductName] = useState('');
  
  const decodedProductName = decodeURIComponent(params.name as string);
  const isUnnamedProduct = decodedProductName === 'Unnamed Product';

  useEffect(() => {
    const productDataString = sessionStorage.getItem('identifiedProduct');
    if (productDataString) {
        try {
            const data = JSON.parse(productDataString) as ImageAnalysisState;
            setAnalysisResult(data);
            setImageUrl(data.imageUrl || null);
            setManualProductName(data.productName === 'Unnamed Product' ? '' : data.productName || '');
        } catch (e) {
            console.error("Failed to parse product data from sessionStorage", e);
        }
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
        if (isUnnamedProduct) {
          setIsLoading(false);
          setProduct(null); // It's a new product, no need to fetch
          return;
        };

        if (!firestore || !decodedProductName) return;

        setIsLoading(true);
        const productId = decodedProductName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const productRef = doc(firestore, 'products', productId);
        
        try {
            const docSnap = await getDoc(productRef);
            if (docSnap.exists()) {
                const fetchedProduct = { id: docSnap.id, ...docSnap.data() } as Product;
                setProduct(fetchedProduct);
                if (fetchedProduct.imageUrl && !imageUrl) {
                    setImageUrl(fetchedProduct.imageUrl);
                }
            } else {
                 setProduct(null); // This is a new product, so it won't exist yet
            }
        } catch(e) {
            console.error("Error fetching product: ", e);
            toast({
                variant: 'destructive',
                title: t('databaseError'),
                description: t('couldNotFetchProduct')
            })
        } finally {
            setIsLoading(false);
        }
    }

    fetchProduct();

  }, [firestore, decodedProductName, imageUrl, isUnnamedProduct]);
  
  const handleManualNameSubmit = useCallback(async () => {
    const trimmedName = manualProductName.trim();
    if (!trimmedName || !analysisResult) {
      toast({
        variant: 'destructive',
        title: t('invalidInputTitle'),
        description: t('invalidInputDescription'),
      });
      return;
    }
    
    // Check for duplicate product
    const { exists, productId } = await checkProductExists(trimmedName);
    
    if (exists && productId) {
      // Product already exists
      if (user && !user.isAnonymous) {
        // Registered user: redirect to product page to vote
        toast({
          title: t('productExistsTitle'),
          description: t('productExistsRedirect'),
        });
        router.push(`/product/${encodeURIComponent(trimmedName)}`);
        return;
      } else {
        // Anonymous user: show error, cannot vote on existing product
        toast({
          variant: 'destructive',
          title: t('productExistsTitle'),
          description: t('productExistsSignIn'),
        });
        return;
      }
    }
    
    const updatedAnalysis = { ...analysisResult, productName: trimmedName };
    sessionStorage.setItem('identifiedProduct', JSON.stringify(updatedAnalysis));

    startTransition(() => {
      router.replace(`/vibe-check/${encodeURIComponent(trimmedName)}`, { scroll: false });
    });
  }, [analysisResult, manualProductName, router, user, t]);

  const handleVibeSubmitted = useCallback(async (vote: Vote) => {
    setLatestVote(vote);

    if (!product && firestore) {
      // If product was just created, we need to fetch it to show the fine-tune panel
      const productId = decodedProductName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const productRef = doc(firestore, 'products', productId);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
    }
    
    setShowFineTune(true);
  }, [product, firestore, decodedProductName]);

  useEffect(() => {
    if (showFineTune && fineTuneRef.current) {
      fineTuneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showFineTune]);

return (
    <div className="flex flex-col gap-8">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{decodedProductName}</CardTitle>
            <CardDescription>
              {isUnnamedProduct ? t('unnamedProductDescription') : t('identifiedProductDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {imageUrl ? (
              <div className="relative w-full rounded-md overflow-hidden border p-4 flex justify-center items-center">
                <img 
                  src={imageUrl} 
                  alt={`Image of ${decodedProductName}`} 
                  className="max-w-full h-auto max-h-[400px] object-contain"
                />
              </div>
            ) : (
                <Skeleton className="w-full aspect-[4/3]" />
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        {isUnnamedProduct ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">{t('nameThisProduct')}</CardTitle>
              <CardDescription>{t('aiCouldntRead')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product-name">{t('productNameLabel')}</Label>
                <Input
                  id="product-name"
                  value={manualProductName}
                  onChange={(e) => setManualProductName(e.target.value)}
                  placeholder={t('productNamePlaceholder')}
                />
              </div>
              <Button onClick={handleManualNameSubmit} disabled={isPending || !manualProductName.trim()} className="w-full">
                {isPending ? t('saving') : t('setProductNameContinue')}
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardHeader><CardTitle>{t('loadingVibePanel')}</CardTitle></CardHeader>
            <CardContent><Skeleton className="h-96 w-full" /></CardContent>
          </Card>
        ) : (
          <VotingPanel 
            product={product} // Can be null for a new product
            productName={decodedProductName}
            analysisResult={analysisResult}
            onVibeSubmit={handleVibeSubmitted}
          />
        )}
      </div>

      {showFineTune && product && latestVote && (
        <div ref={fineTuneRef} className="mt-8 scroll-mt-8">
          <FineTunePanel product={product} initialVote={latestVote} />
        </div>
      )}
    </div>
  );
}
