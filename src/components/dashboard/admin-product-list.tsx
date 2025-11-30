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
import Link from 'next/link';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type AdminProductListProps = {
  chartData: Product[];
  onItemClick?: (productName: string) => void;
  highlightedProduct?: string | null;
  loading: boolean;
};

export function AdminProductList({ chartData, onItemClick, highlightedProduct, loading }: AdminProductListProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleDelete = async (productId: string, productName: string) => {
        if (!firestore) return;
        const productRef = doc(firestore, 'products', productId);
        try {
            await deleteDoc(productRef);
            toast({
                title: 'Product Deleted',
                description: `"${productName}" has been successfully deleted.`,
            });
        } catch (error) {
            console.error("Error deleting product: ", error);
            toast({
                variant: 'destructive',
                title: 'Error Deleting Product',
                description: 'There was a problem deleting the product.',
            });
        }
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Product Management</CardTitle>
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
              className={cn(
                "rounded-md transition-all scroll-mt-20 flex items-center gap-2",
                highlightedProduct === item.name ? 'bg-muted ring-2 ring-primary' : 'hover:bg-muted'
              )}
              style={{scrollMarginTop: '80px'}} // For smooth scroll offset
            >
              <Link 
                href={`/product/${encodeURIComponent(item.name)}`} 
                className="flex-1 flex items-center gap-4 p-2 cursor-pointer"
                onClick={() => onItemClick?.(item.name)}
                >
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
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Safety: {Math.round(item.avgSafety || 0)}%</span>
                    <span>•</span>
                    <span>Taste: {Math.round(item.avgTaste || 0)}%</span>
                  </div>
                </div>
              </Link>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive mr-2">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product
                            and all its associated votes and reports.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id, item.name)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
