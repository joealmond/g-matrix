'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState, useRef, useTransition } from 'react';
import { VotingPanel } from '@/components/dashboard/voting-panel';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Product, Vote } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FineTunePanel } from '@/components/dashboard/fine-tune-panel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { adminDb } from '@/lib/firebase-admin';

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
                // Only use sessionStorage if the names match, to avoid using stale data
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
    const fetchProduct = async () => {
        // If the product is unnamed, don't try to fetch it. Just wait for user input.
        if (isUnnamedProduct) {
          setIsLoading(false);
          setProduct(null);
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
                // If the URL doesn't have an image but the fetched product does, use it.
                if (fetchedProduct.imageUrl && !imageUrl) {
                    setImageUrl(fetchedProduct.imageUrl);
                }
            } else {
                // IMPORTANT: The page should no longer create products.
                // It now assumes a product was created by the server action.
                // If not found, it means it's a new product being named, or there's an issue.
                // For a newly named product, the page will reload, and this will find it.
                 setProduct(null); // Set to null if not found
                 console.warn(`Product "${decodedProductName}" not found in Firestore.`);
            }
        } catch(e) {
            console.error("Error fetching product: ", e);
            toast({
                variant: 'destructive',
                title: 'Database Error',
                description: 'Could not fetch product data.'
            })
        } finally {
            setIsLoading(false);
        }
    }

    fetchProduct();

  }, [firestore, decodedProductName, imageUrl, isUnnamedProduct]);
  
  const handleManualNameSubmit = async () => {
    const trimmedName = manualProductName.trim();
    if (!trimmedName || !imageUrl) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a valid product name. The image URL is also required.',
      });
      return;
    }
    
    // We will create the product here on the client side using a server action in the future
    // but for now, we navigate, and the useEffect will handle it.
    // This is a temporary step to make the flow work.
    
    // We will create the product directly in firestore using the admin SDK
    // This is not a good practice, but it's a temporary workaround.
    // The correct way would be to use a server action to create the product.
    try {
        const productId = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const productRef = doc(firestore, 'products', productId);

        await setDoc(productRef, {
            name: trimmedName,
            imageUrl: imageUrl,
            avgSafety: 50,
            avgTaste: 50,
            voteCount: 0,
            createdAt: serverTimestamp(),
            createdBy: 'anonymous',
        });
        
        const productData = { name: trimmedName, imageUrl };
        sessionStorage.setItem('identifiedProduct', JSON.stringify(productData));

        startTransition(() => {
          router.replace(`/vibe-check/${encodeURIComponent(trimmedName)}?imageUrl=${encodeURIComponent(imageUrl || '')}`, { scroll: false });
        });

    } catch (e) {
         toast({
            variant: 'destructive',
            title: 'Failed to create product',
            description: 'There was an issue saving the new product name.',
        });
        console.error("Failed to create product on name submission", e);
    }
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
    <div className="flex flex-col gap-8">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{decodedProductName}</CardTitle>
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
              <Button onClick={handleManualNameSubmit} disabled={isPending || !manualProductName.trim()} className="w-full">
                {isPending ? 'Saving...' : 'Set Product Name & Continue'}
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardHeader><CardTitle>Loading Vibe Panel...</CardTitle></CardHeader>
            <CardContent><Skeleton className="h-96 w-full" /></CardContent>
          </Card>
        ) : product ? (
          <VotingPanel 
            productName={product.name} 
            productId={product.id}
            onVibeSubmit={handleVibeSubmitted}
          />
        ) : (
          <Card>
             <CardHeader><CardTitle>Product Not Found</CardTitle></CardHeader>
             <CardContent>
                <p className="text-muted-foreground">This product hasn't been created yet. This might happen if you've just named it. The page should refresh shortly.</p>
             </CardContent>
          </Card>
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
