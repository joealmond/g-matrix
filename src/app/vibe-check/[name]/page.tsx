'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { VotingPanel } from '@/components/dashboard/voting-panel';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function VibeCheckPage() {
  const params = useParams();
  const firestore = useFirestore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const decodedProductName = decodeURIComponent(params.name as string);

  useEffect(() => {
    // 1. Get image from session storage
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
  
    // 2. Find or create the product in Firestore
    const findOrCreateProduct = async () => {
        if (!firestore || !decodedProductName) return;
        setIsLoading(true);

        // A simple way to create a consistent ID is to hash the name,
        // but for simplicity, we'll just use the name as the ID.
        // This is not robust for names with special characters, but works for this case.
        const productId = decodedProductName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const productRef = doc(firestore, 'products', productId);
        
        try {
            const docSnap = await getDoc(productRef);

            if (docSnap.exists()) {
                setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
            } else {
                // Product doesn't exist, create it.
                const newProduct: Product = {
                    id: productId,
                    name: decodedProductName,
                    imageUrl: imageUrl || 'https://placehold.co/600x400',
                    avgSafety: 0,
                    avgTaste: 0,
                    voteCount: 0,
                };
                
                setDoc(productRef, newProduct)
                  .then(() => {
                    setProduct(newProduct);
                  })
                  .catch((serverError) => {
                    const permissionError = new FirestorePermissionError({
                      path: productRef.path,
                      operation: 'create',
                      requestResourceData: newProduct
                    });
                    errorEmitter.emit('permission-error', permissionError);
                  });
            }
        } catch(e) {
            console.error("Error finding or creating product: ", e);
        } finally {
            setIsLoading(false);
        }
    }

    findOrCreateProduct();

  }, [firestore, decodedProductName, imageUrl]);

  return (
    <div className="container mx-auto p-4">
       <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl">
              Product Vibe Check
            </h1>
        </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>{decodedProductName}</CardTitle>
                    <CardDescription>The product identified from your image.</CardDescription>
                </CardHeader>
                <CardContent>
                    {imageUrl ? (
                      <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                        <Image 
                          src={imageUrl} 
                          alt={`Image of ${decodedProductName}`} 
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                        <Skeleton className="w-full aspect-square" />
                    )}
                </CardContent>
            </Card>
        </div>
        <div>
            {isLoading || !product ? (
                <Card>
                    <CardHeader><CardTitle>Loading Vibe Panel...</CardTitle></CardHeader>
                    <CardContent><Skeleton className="h-96 w-full" /></CardContent>
                </Card>
            ) : (
                <VotingPanel productName={product.name} productId={product.id} />
            )}
        </div>
      </div>
    </div>
  );
}
