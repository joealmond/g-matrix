'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function ProductPage() {
  const params = useParams();
  const [productName, setProductName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const decodedProductName = decodeURIComponent(params.name as string);

  useEffect(() => {
    // Retrieve product data from sessionStorage
    const productDataString = sessionStorage.getItem('identifiedProduct');
    if (productDataString) {
      try {
        const productData = JSON.parse(productDataString);
        // Ensure the data is for the current product page
        if (productData.name === decodedProductName) {
          setProductName(productData.name);
          setImageUrl(productData.imageUrl);
        }
      } catch (e) {
        console.error("Failed to parse product data from sessionStorage", e);
      }
    }
  }, [decodedProductName]);


  return (
    <div className="container mx-auto p-4">
       <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl">
              Identified Product
            </h1>
        </div>

      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
            <CardTitle className='font-headline'>{productName || 'Loading...'}</CardTitle>
            <CardDescription>This is the product identified from your image.</CardDescription>
        </CardHeader>
        <CardContent>
            {imageUrl ? (
              <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                <Image 
                  src={imageUrl} 
                  alt={`Image of ${productName}`} 
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>Image not available.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
