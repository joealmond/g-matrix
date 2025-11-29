'use client';

import { VotingPanel } from '@/components/dashboard/voting-panel';
import { TrendingFoods } from '@/components/dashboard/trending-foods';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Undo, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { DraggableDot } from '@/components/dashboard/draggable-dot';
import { ProductVibeChart } from '@/components/dashboard/product-vibe-chart';
import { useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp, setDoc, collection, getDoc } from 'firebase/firestore';
import type { Product, Vote } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { SecurityRuleContext } from '@/firebase/errors';

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const initialProductName = decodeURIComponent(params.name as string);
  const imageUrl = searchParams.get('imageUrl');

  const productDocRef = useMemo(() => {
    if (!firestore || !initialProductName) return null;
    return doc(firestore, 'products', initialProductName);
  }, [firestore, initialProductName]);

  const { data: product, loading } = useDoc<Product>(productDocRef);
  
  const [originalVibe, setOriginalVibe] = useState<{ safety: number; taste: number } | null>(null);
  const [originalProductName, setOriginalProductName] = useState(initialProductName);

  const [vibe, setVibe] = useState<{ safety: number; taste: number } | null>(null);
  const [productName, setProductName] = useState(initialProductName);
  
  const [showChart, setShowChart] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
    if (loading || !firestore) return;

    const checkAndCreateProduct = async () => {
      if (!product && productDocRef) {
        // Product doesn't exist, create it.
        const newProductData = {
            id: initialProductName,
            name: initialProductName,
            imageUrl: imageUrl || `https://picsum.photos/seed/${initialProductName}/400/400`,
            avgSafety: 50,
            avgTaste: 50,
            voteCount: 0,
        };
        setDoc(productDocRef, newProductData)
          .catch((serverError) => {
              const permissionError = new FirestorePermissionError({
                path: productDocRef.path,
                operation: 'create',
                requestResourceData: newProductData,
              } satisfies SecurityRuleContext);
              errorEmitter.emit('permission-error', permissionError);
          });
      } else if (product) {
         const initialVibe = { safety: product.avgSafety, taste: product.avgTaste };
         if (!vibe) {
           setVibe(initialVibe);
           setOriginalVibe(initialVibe);
           setShowChart(true);
         }
      }
    };

    checkAndCreateProduct();
  }, [product, loading, firestore, initialProductName, imageUrl, productDocRef, vibe]);


  const isChanged = originalVibe && vibe && (
    productName !== originalProductName ||
    vibe.safety !== originalVibe.safety ||
    vibe.taste !== originalVibe.taste
  );

  const handleVibeSubmit = (submittedVibe: Vote) => {
    setVibe(submittedVibe);
    setOriginalVibe(submittedVibe); 
    setShowChart(true);
    setTimeout(() => {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSaveEdit = async () => {
    if (!firestore || !vibe || !product || !productDocRef) return;

    const voteData = {
        safety: vibe.safety,
        taste: vibe.taste,
        createdAt: serverTimestamp(),
    };
    const voteRef = doc(collection(firestore, 'products', product.id, 'votes'));

    setDoc(voteRef, voteData)
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: voteRef.path,
          operation: 'create',
          requestResourceData: voteData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
      
      const newVoteCount = (product.voteCount || 0) + 1;
      const newAvgSafety = ((product.avgSafety * (product.voteCount || 0)) + vibe.safety) / newVoteCount;
      const newAvgTaste = ((product.avgTaste * (product.voteCount || 0)) + vibe.taste) / newVoteCount;
      
      const productUpdateData = {
        avgSafety: newAvgSafety,
        avgTaste: newAvgTaste,
        voteCount: newVoteCount
      };

      updateDoc(productDocRef, productUpdateData)
        .then(() => {
            toast({
                title: "Vibe Updated!",
                description: `Your fine-tuned vibe for ${productName} has been saved.`,
            });
            setOriginalProductName(productName);
            setOriginalVibe(vibe);
        })
        .catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: productDocRef.path,
            operation: 'update',
            requestResourceData: productUpdateData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
      });
  }
  
  const handleReset = () => {
    setProductName(originalProductName);
    if (originalVibe) {
      setVibe(originalVibe);
    }
  }
  
  const handleVibeChange = (newVibe: { safety: number, taste: number}) => {
    setVibe(newVibe);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading Product...</p>
      </div>
    );
  }

  if (!product) {
     return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Creating new product...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
       <div className="md:col-span-3 flex items-center justify-between">
            <h1 className="font-headline text-3xl">
              Rate: {product.name}
            </h1>
        </div>

      <div className="md:col-span-2 space-y-6">
        <VotingPanel productName={productName} onVibeSubmit={handleVibeSubmit} productId={product.id} />
      </div>
      <div className="md:col-span-1 space-y-6">
        <TrendingFoods />
      </div>

      {showChart && vibe && (
         <div className="md:col-span-3 grid gap-6 md:grid-cols-3" ref={chartRef}>
            <div className="md:col-span-2 relative">
              <h2 className="text-2xl font-headline mb-4">Product Vibe</h2>
              <ProductVibeChart />
              <DraggableDot 
                safety={vibe.safety}
                taste={vibe.taste}
                onVibeChange={handleVibeChange}
              />
            </div>
            <div className="md:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle className='font-headline'>Fine-Tune Vibe</CardTitle>
                        <CardDescription>Drag the dot or use the sliders to pinpoint the vibe.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                             <Label htmlFor="productName">Product Name</Label>
                             <Input 
                                id="productName" 
                                value={productName} 
                                onChange={(e) => setProductName(e.target.value)}
                                disabled // Disabling name changes for now
                            />
                        </div>
                       <div className="space-y-2">
                         <Label htmlFor="safety-slider">Safety: {vibe.safety}%</Label>
                         <Slider
                            id="safety-slider"
                            min={0}
                            max={100}
                            step={1}
                            value={[vibe.safety]}
                            onValueChange={([value]) => setVibe(v => ({...v!, safety: value}))}
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="taste-slider">Taste: {vibe.taste}%</Label>
                         <Slider
                            id="taste-slider"
                             min={0}
                            max={100}
                            step={1}
                            value={[vibe.taste]}
                            onValueChange={([value]) => setVibe(v => ({...v!, taste: value}))}
                         />
                       </div>
                    </CardContent>
                    {isChanged && (
                        <CardFooter className="flex-col gap-2">
                             <Button onClick={handleSaveEdit} className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                Confirm Vibe
                             </Button>
                             <Button onClick={handleReset} variant="outline" className="w-full">
                                <Undo className="mr-2 h-4 w-4" />
                                Reset
                             </Button>
                        </CardFooter>
                    )}
                 </Card>
            </div>
        </div>
      )}
    </div>
  );
}
