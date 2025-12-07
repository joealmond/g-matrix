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
import { useTranslations } from 'next-intl';

export default function ProductDetailsPage() {
  const t = useTranslations('ProductPage');
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
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-headline">{t('productNotFound')}</h1>
        <p className="text-muted-foreground">{t('productNotFoundDescription', { name: decodedProductName })}</p>
      </div>
    );
  }
  
  const getRatingBadge = (value: number) => {
    if (value > 75) return <Badge variant="default" className="bg-green-500">{t('excellent')}</Badge>;
    if (value > 50) return <Badge variant="secondary">{t('good')}</Badge>;
    if (value > 25) return <Badge variant="outline">{t('fair')}</Badge>;
    return <Badge variant="destructive">{t('poor')}</Badge>;
  }

  return (
    <div className="container mx-auto p-4">
       <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl">
              {t('productDetails')}
            </h1>
        </div>
      
      <div className="flex flex-col md:grid md:grid-cols-2 gap-8">
        <div>
          <Card>
              <CardHeader>
                  <CardTitle className='font-headline'>{product.name}</CardTitle>
                  <CardDescription>{t('communitySourcedVibe')}</CardDescription>
              </CardHeader>
              <CardContent>
                  {product?.imageUrl ? (
                    <div className="relative w-full rounded-md overflow-hidden border p-4 flex justify-center items-center">
                      <img 
                        src={product.imageUrl} 
                        alt={`Image of ${product.name}`} 
                        className="max-h-[400px] w-auto max-w-full object-contain"
                      />
                    </div>
                  ) : (
                      <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center">
                        <span className="text-muted-foreground">{t('noImage')}</span>
                      </div>
                  )}
              </CardContent>
          </Card>
        </div>
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-headline">{t('overallVibe')}</CardTitle>
              <CardDescription>{t('basedOnVotes', { count: product.voteCount || 0 })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-around text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('averageSafety')}</p>
                    <p className="text-3xl font-bold">{Math.round(product.avgSafety || 0)}%</p>
                    {getRatingBadge(product.avgSafety || 0)}
                  </div>
                   <div>
                    <p className="text-sm text-muted-foreground">{t('averageTaste')}</p>
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
