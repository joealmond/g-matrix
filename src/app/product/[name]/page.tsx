'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ProductVibeChart } from '@/components/dashboard/product-vibe-chart';

export default function ProductDetailsPage() {
  const params = useParams();
  const firestore = useFirestore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodedProductName = decodeURIComponent(params.name as string);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!firestore || !decodedProductName) return;
      setIsLoading(true);

      const productId = decodedProductName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const productRef = doc(firestore, 'products', productId);

      try {
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          console.log('No such product!');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [firestore, decodedProductName]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-headline">Product not found</h1>
        <p className="text-muted-foreground">The product "{decodedProductName}" could not be found.</p>
      </div>
    );
  }
  
  const getRatingBadge = (value: number) => {
    if (value > 75) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (value > 50) return <Badge variant="secondary">Good</Badge>;
    if (value > 25) return <Badge variant="outline">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  }

  return (
    <div className="container mx-auto p-4">
       <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl">
              Product Details
            </h1>
        </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
              <CardHeader>
                  <CardTitle className='font-headline'>{product.name}</CardTitle>
                  <CardDescription>Community-sourced vibe for this product.</CardDescription>
              </CardHeader>
              <CardContent>
                  {product?.imageUrl ? (
                    <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                      <img 
                        src={product.imageUrl} 
                        alt={`Image of ${product.name}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                      <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                  )}
              </CardContent>
          </Card>
        </div>
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-headline">Overall Vibe</CardTitle>
              <CardDescription>Based on {product.voteCount || 0} votes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-around text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Safety</p>
                    <p className="text-3xl font-bold">{Math.round(product.avgSafety || 0)}%</p>
                    {getRatingBadge(product.avgSafety || 0)}
                  </div>
                   <div>
                    <p className="text-sm text-muted-foreground">Average Taste</p>
                    <p className="text-3xl font-bold">{Math.round(product.avgTaste || 0)}%</p>
                    {getRatingBadge(product.avgTaste || 0)}
                  </div>
                </div>
                 <div className="relative h-[400px]">
                    <ProductVibeChart />
                    {product.avgTaste !== undefined && product.avgSafety !== undefined && (
                      <div
                          className="absolute w-4 h-4 rounded-full bg-primary border-2 border-primary-foreground shadow-lg"
                          style={{
                            left: `calc(${product.avgTaste}% - 8px)`,
                            top: `calc(${100 - product.avgSafety}% - 8px)`,
                          }}
                      />
                    )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
