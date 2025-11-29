'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { chartColors } from './matrix-chart';
import { cn } from '@/lib/utils';

type ProductListProps = {
  chartData: { product: string; safety: number; taste: number }[];
  onItemClick?: (productName: string) => void;
  highlightedProduct?: string | null;
};

export function ProductList({ chartData, onItemClick, highlightedProduct }: ProductListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Product Details</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {chartData.map((item, index) => (
            <li
              key={item.product}
              id={`product-item-${item.product}`}
              onClick={() => onItemClick?.(item.product)}
              className={cn(
                "flex items-center gap-4 p-2 rounded-md transition-all scroll-mt-20 cursor-pointer",
                highlightedProduct === item.product ? 'bg-muted ring-2 ring-primary' : 'hover:bg-muted'
              )}
              style={{scrollMarginTop: '80px'}} // For smooth scroll offset
            >
              <span
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
              <div className="flex-1">
                <p className="font-semibold">{item.product}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Safety: {item.safety}%</span>
                  <span>•</span>
                  <span>Taste: {item.taste}%</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
