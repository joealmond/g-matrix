'use client';

import { VotingPanel } from '@/components/dashboard/voting-panel';
import { TrendingFoods } from '@/components/dashboard/trending-foods';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [productName, setProductName] = useState(decodeURIComponent(params.name as string));
  
  const [showChart, setShowChart] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [vibe, setVibe] = useState({ safety: 70, taste: 80 });

  const chartRef = useRef<HTMLDivElement>(null);

  const handleVibeSubmit = () => {
    setShowChart(true);
    setTimeout(() => {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const chartData = [{ product: productName, safety: vibe.safety, taste: vibe.taste }];

  const handleSaveEdit = () => {
    setIsEditing(false);
    toast({
        title: "Vibe Updated!",
        description: `Your fine-tuned vibe for ${productName} has been saved.`,
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-3">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Rate: {productName}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="md:col-span-2 space-y-6">
        <VotingPanel productName={productName} onVibeSubmit={handleVibeSubmit} />
      </div>
      <div className="md:col-span-1 space-y-6">
        <TrendingFoods />
      </div>

      {showChart && (
         <div className="md:col-span-3 grid gap-6 md:grid-cols-3" ref={chartRef}>
            <div className="md:col-span-2">
              <h2 className="text-2xl font-headline mb-4">Product Vibe</h2>
              <MatrixChart chartData={chartData} highlightedProduct={productName}/>
            </div>
            <div className="md:col-span-1">
                 <Card>
                    <CardHeader className='flex-row items-center justify-between'>
                        <CardTitle className='font-headline'>Fine-Tune Vibe</CardTitle>
                         <Button variant={isEditing ? "default" : "outline"} size="icon" onClick={() => {
                             if (isEditing) {
                                 handleSaveEdit();
                             } else {
                                 setIsEditing(true)
                             }
                         }}>
                            {isEditing ? <Save className="h-4 w-4"/> : <Edit className="h-4 w-4"/>}
                            <span className="sr-only">{isEditing ? "Save" : "Edit"}</span>
                         </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                             <Label htmlFor="productName">Product Name</Label>
                             <Input 
                                id="productName" 
                                value={productName} 
                                onChange={(e) => setProductName(e.target.value)}
                                disabled={!isEditing} 
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
                            onValueChange={([value]) => setVibe(v => ({...v, safety: value}))}
                            disabled={!isEditing}
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
                            onValueChange={([value]) => setVibe(v => ({...v, taste: value}))}
                            disabled={!isEditing}
                         />
                       </div>
                    </CardContent>
                    {isEditing && (
                        <CardFooter>
                             <Button onClick={handleSaveEdit} className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                Confirm Vibe
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
