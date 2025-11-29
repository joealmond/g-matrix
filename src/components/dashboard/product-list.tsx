'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

type ProductListProps = {
  chartData: Product[];
  onItemClick?: (productName: string) => void;
  highlightedProduct?: string | null;
  loading: boolean;
};

export function ProductList({ chartData, onItemClick, highlightedProduct, loading }: ProductListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Product Details</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <ul className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </ul>
        )}
        {!loading && chartData.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
                <p>No products found.</p>
                <p className="text-sm">Scan a product to get started!</p>
            </div>
        )}
        <ul className="space-y-2">
          {chartData.map((item) => (
            <li
              key={item.id}
              id={`product-item-${item.name}`}
              onClick={() => onItemClick?.(item.name)}
              className={cn(
                "flex items-center gap-4 p-2 rounded-md transition-all scroll-mt-20 cursor-pointer",
                highlightedProduct === item.name ? 'bg-muted ring-2 ring-primary' : 'hover:bg-muted'
              )}
              style={{scrollMarginTop: '80px'}} // For smooth scroll offset
            >
              <div
                className="h-12 w-12 rounded-md bg-muted flex-shrink-0 relative overflow-hidden"
              >
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Safety: {Math.round(item.avgSafety)}%</span>
                  <span>•</span>
                  <span>Taste: {Math.round(item.avgTaste)}%</span>
                </div>
              </div>
               <Button asChild variant="ghost" size="icon">
                  <Link href={`/product/${encodeURIComponent(item.name)}`}>
                    <ArrowRight />
                  </Link>
                </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
