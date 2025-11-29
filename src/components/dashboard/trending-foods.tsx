'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection } from '@/firebase';
import { useFirestore } from '@/firebase';
import { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import Link from 'next/link';


export function TrendingFoods() {
  const firestore = useFirestore();

  const trendingQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('avgSafety', 'desc'), limit(5));
  }, [firestore]);

  const { data: trendingFoods, loading } = useCollection<Product>(trendingQuery);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Trending Safe Foods</CardTitle>
        <CardDescription>Community-vouched safe products</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        
        {!loading && trendingFoods && trendingFoods.length > 0 ? (
          <ul className="space-y-4">
            {trendingFoods.map(food => {
              const safetyColor = food.avgSafety > 70 ? 'text-green-400' : food.avgSafety > 40 ? 'text-yellow-400' : 'text-red-400';
              const tasteColor = food.avgTaste > 70 ? 'text-primary' : food.avgTaste > 40 ? 'text-yellow-400' : 'text-blue-400';

              return (
                <li key={food.id}>
                  <Link href={`/product/${food.name}`} className="flex items-center gap-4 hover:bg-muted p-2 rounded-md">
                  <Avatar className="h-12 w-12 rounded-lg">
                    {food.imageUrl && (
                      <AvatarImage
                        src={food.imageUrl}
                        alt={food.name}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="rounded-lg">
                      {food.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{food.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`font-bold ${safetyColor}`}>{Math.round(food.avgSafety)}% Safe</span>
                      <span>•</span>
                      <span className={`font-bold ${tasteColor}`}>{Math.round(food.avgTaste)}% Taste</span>
                    </div>
                  </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          !loading && <p className="text-sm text-muted-foreground">No trending foods right now.</p>
        )}
      </CardContent>
    </Card>
  );
}
