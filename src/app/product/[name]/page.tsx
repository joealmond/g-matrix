'use client';

import { VotingPanel } from '@/components/dashboard/voting-panel';
import { TrendingFoods } from '@/components/dashboard/trending-foods';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Undo } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const initialProductName = decodeURIComponent(params.name as string);
  
  const [originalVibe, setOriginalVibe] = useState<{ safety: number; taste: number } | null>(null);
  const [originalProductName, setOriginalProductName] = useState(initialProductName);

  const [vibe, setVibe] = useState<{ safety: number; taste: number } | null>(null);
  const [productName, setProductName] = useState(initialProductName);
  
  const [showChart, setShowChart] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);

  const isChanged = originalVibe && vibe && (
    productName !== originalProductName ||
    vibe.safety !== originalVibe.safety ||
    vibe.taste !== originalVibe.taste
  );

  const handleVibeSubmit = (submittedVibe: { safety: number, taste: number}) => {
    setVibe(submittedVibe);
    setOriginalVibe(submittedVibe); 
    setShowChart(true);
    setTimeout(() => {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const chartData = vibe ? [{ product: productName, safety: vibe.safety, taste: vibe.taste }] : [];

  const handleSaveEdit = () => {
    toast({
        title: "Vibe Updated!",
        description: `Your fine-tuned vibe for ${productName} has been saved.`,
    });
    setOriginalProductName(productName);
    if(vibe) {
      setOriginalVibe(vibe);
    }
  }
  
  const handleReset = () => {
    setProductName(originalProductName);
    if (originalVibe) {
      setVibe(originalVibe);
    }
  }
  
  const handleVibeChangeFromChart = (newVibe: { safety: number, taste: number}) => {
    setVibe(newVibe);
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
       <div className="md:col-span-3 flex items-center justify-between">
            <h1 className="font-headline text-3xl">
              Rate: {initialProductName}
            </h1>
        </div>

      <div className="md:col-span-2 space-y-6">
        <VotingPanel productName={productName} onVibeSubmit={handleVibeSubmit} />
      </div>
      <div className="md:col-span-1 space-y-6">
        <TrendingFoods />
      </div>

      {showChart && vibe && (
         <div className="md:col-span-3 grid gap-6 md:grid-cols-3" ref={chartRef}>
            <div className="md:col-span-2">
              <h2 className="text-2xl font-headline mb-4">Product Vibe</h2>
              <MatrixChart 
                chartData={chartData} 
                highlightedProduct={productName} 
                onVibeChange={handleVibeChangeFromChart}
                isDraggable={true}
                showTooltip={false}
              />
            </div>
            <div className="md:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle className='font-headline'>Fine-Tune Vibe</CardTitle>
                        <CardDescription>Adjust the scores to pinpoint the vibe.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                             <Label htmlFor="productName">Product Name</Label>
                             <Input 
                                id="productName" 
                                value={productName} 
                                onChange={(e) => setProductName(e.target.value)}
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
