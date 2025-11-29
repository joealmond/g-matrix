'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const productName = decodeURIComponent(params.name as string);
  const imageUrl = searchParams.get('imageUrl');

  return (
    <div className="container mx-auto p-4">
       <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl">
              Identified Product
            </h1>
        </div>

      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
            <CardTitle className='font-headline'>{productName}</CardTitle>
            <CardDescription>This is the product identified from your image.</CardDescription>
        </CardHeader>
        <CardContent>
            {imageUrl && (
              <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                <Image 
                  src={imageUrl} 
                  alt={`Image of ${productName}`} 
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
