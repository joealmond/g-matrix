'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Users, ShieldCheck } from 'lucide-react';

type ProductListProps = {
  chartData: Product[];
  onItemClick?: (productName: string) => void;
  highlightedProduct?: string | null;
  loading: boolean;
};

export function ProductList({ chartData, onItemClick, highlightedProduct, loading }: ProductListProps) {
  const t = useTranslations('ProductList');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('title')}</CardTitle>
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
                <p>{t('noProducts')}</p>
                <p className="text-sm">{t('scanToStart')}</p>
            </div>
        )}
        <ul className="space-y-2">
          {chartData.map((item) => (
            <li
              key={item.id}
              id={`product-item-${item.name}`}
              onClick={() => onItemClick?.(item.name)}
              className={cn(
                "rounded-md transition-all scroll-mt-20",
                highlightedProduct === item.name ? 'bg-muted ring-2 ring-primary' : 'hover:bg-muted'
              )}
              style={{scrollMarginTop: '80px'}} // For smooth scroll offset
            >
              <Link href={`/product/${encodeURIComponent(item.name)}`} className="flex items-center gap-4 p-2 cursor-pointer">
                <div
                  className="h-12 w-12 rounded-md bg-muted flex-shrink-0 relative overflow-hidden"
                >
                  {item?.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground"></span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{t('safety', { value: Math.round(item.avgSafety || 0) })}</span>
                    <span>•</span>
                    <span>{t('taste', { value: Math.round(item.avgTaste || 0) })}</span>
                  </div>
                  {/* Vote counts */}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      <Users className="h-3 w-3 mr-1" />
                      {item.voteCount || 0}
                    </Badge>
                    {(item.registeredVoteCount || 0) > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {item.registeredVoteCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
