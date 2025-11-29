'use client';

import { VotingPanel } from '@/components/dashboard/voting-panel';
import { TrendingFoods } from '@/components/dashboard/trending-foods';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productName = decodeURIComponent(params.name as string);

  const [showChart, setShowChart] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleVibeSubmit = () => {
    setShowChart(true);
    setTimeout(() => {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  // Dummy data for the single product to highlight
  const chartData = [{ product: productName, safety: 70, taste: 80 }];


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
         <div className="md:col-span-3" ref={chartRef}>
          <h2 className="text-2xl font-headline mb-4">Product Vibe</h2>
          <MatrixChart chartData={chartData} highlightedProduct={productName}/>
        </div>
      )}
    </div>
  );
}
