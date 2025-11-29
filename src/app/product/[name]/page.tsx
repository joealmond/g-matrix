'use client';

import { VotingPanel } from '@/components/dashboard/voting-panel';
import { TrendingFoods } from '@/components/dashboard/trending-foods';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductPage() {
  const params = useParams();
  const productName = decodeURIComponent(params.name as string);

  return (
    <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-3">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">
                        Rate: {productName}
                    </CardTitle>
                </CardHeader>
            </Card>
        </div>
      <div className="md:col-span-2 space-y-6">
        <VotingPanel productName={productName} />
      </div>
      <div className="md:col-span-1 space-y-6">
        <TrendingFoods />
      </div>
    </div>
  );
}
