'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useRef, useTransition } from 'react';
import { VotingPanel } from '@/components/dashboard/voting-panel';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Product, Vote } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FineTunePanel } from '@/components/dashboard/fine-tune-panel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function VibeCheckPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [imageUrl, setImageUrl] = useState(searchParams.get('imageUrl') || null);
  
  const [showFineTune, setShowFineTune] = useState(false);
  const [latestVote, setLatestVote] = useState<Vote | null>(null);
  const fineTuneRef = useRef<HTMLDivElement>(null);
  
  const [manualProductName, setManualProductName] = useState('');
  
  const decodedProductName = decodeURIComponent(params.name as string);
  const isUnnamedProduct = decodedProductName === 'Unnamed Product' || !decodedProductName;

  useEffect(() => {
    if (!imageUrl) {
        const productDataString = sessionStorage.getItem('identifiedProduct');
        if (productDataString) {
            try {
                const productData = JSON.parse(productDataString);
                if (productData.name === decodedProductName) {
                    setImageUrl(productData.imageUrl);
                }
            } catch (e) {
                console.error("Failed to parse product data from sessionStorage", e);
            }
        }
    }
  }, [decodedProductName, imageUrl]);

  useEffect(() => {
    const findOrCreateProduct = async () => {
        if (!firestore || !decodedProductName || isUnnamedProduct) {
          setIsLoading(false);
          return;
        };

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
                const newProductData: Omit<Product, 'id'> = {
                    name: decodedProductName,
                    imageUrl: imageUrl || 'https://placehold.co/600x400',
                    avgSafety: 50,
                    avgTaste: 50,
                    voteCount: 0,
                };
                
                await setDoc(productRef, newProductData);
                setProduct({ id: productId, ...newProductData });
            }
        } catch(e) {
            console.error("Error finding or creating product: ", e);
            toast({
                variant: 'destructive',
                title: 'Database Error',
                description: 'Could not fetch or create product data.'
            })
        } finally {
            setIsLoading(false);
        }
    }

    findOrCreateProduct();

  }, [firestore, decodedProductName, isUnnamedProduct, imageUrl]);
  
  const handleManualNameSubmit = () => {
    const trimmedName = manualProductName.trim();
    if (!trimmedName) {
      toast({
        variant: 'destructive',
        title: 'Invalid Name',
        description: 'Please enter a valid product name.',
      });
      return;
    }
    
    const productData = { name: trimmedName, imageUrl };
    sessionStorage.setItem('identifiedProduct', JSON.stringify(productData));

    startTransition(() => {
      router.replace(`/vibe-check/${encodeURIComponent(trimmedName)}?imageUrl=${encodeURIComponent(imageUrl || '')}`, { scroll: false });
    });
  };

  const handleVibeSubmitted = (vote: Vote) => {
    setLatestVote(vote);
    setShowFineTune(true);
  };

  useEffect(() => {
    if (showFineTune && fineTuneRef.current) {
      fineTuneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showFineTune]);

  return (
    <div className="container mx-auto p-4">
       <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl">
              Product Vibe Check
            </h1>
        </div>
      
      <div className="flex flex-col md:grid md:grid-cols-2 gap-8">
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>{isUnnamedProduct ? 'Unnamed Product' : decodedProductName}</CardTitle>
                    <CardDescription>
                      {isUnnamedProduct ? 'We couldn’t identify this product. Please name it.' : 'The product identified from your image.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {imageUrl ? (
                      <div className="relative w-full rounded-md overflow-hidden border p-4 flex justify-center items-center">
                        <img 
                          src={imageUrl} 
                          alt={`Image of ${decodedProductName}`} 
                          className="max-h-[400px] w-auto max-w-full object-contain"
                        />
                      </div>
                    ) : (
                        <Skeleton className="w-full aspect-square" />
                    )}
                </CardContent>
            </Card>
        </div>
        <div>
          {isUnnamedProduct ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Name This Product</CardTitle>
                <CardDescription>Our AI couldn't read the name. Please enter it below to continue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    value={manualProductName}
                    onChange={(e) => setManualProductName(e.target.value)}
                    placeholder="e.g., Udi's Gluten Free Bread"
                  />
                </div>
                <Button onClick={handleManualNameSubmit} disabled={isPending || !manualProductName} className="w-full">
                  {isPending ? 'Saving...' : 'Set Product Name'}
                </Button>
              </CardContent>
            </Card>
          ) : isLoading || !product ? (
            <Card>
              <CardHeader><CardTitle>Loading Vibe Panel...</CardTitle></CardHeader>
              <CardContent><Skeleton className="h-96 w-full" /></CardContent>
            </Card>
          ) : (
            <VotingPanel 
              productName={product.name} 
              productId={product.id}
              onVibeSubmit={handleVibeSubmitted}
            />
          )}
        </div>
      </div>

      {showFineTune && product && latestVote && (
        <div ref={fineTuneRef} className="mt-8 scroll-mt-8">
          <FineTunePanel product={product} initialVote={latestVote} />
        </div>
      )}
    </div>
  );
}
