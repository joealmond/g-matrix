'use client';

import dynamic from 'next/dynamic';
import { AdSlot } from '@/components/dashboard/ad-slot';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { ProductSearch } from '@/components/dashboard/product-search';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo, useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { AdminProductList } from '@/components/dashboard/admin-product-list';
import { useAdmin } from '@/hooks/use-admin';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useUser } from '@/firebase';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('Admin');
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();

  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { user, loading: isUserLoading } = useUser();
  const router = useRouter();

  const isLoading = isAdminLoading || isUserLoading;

  useEffect(() => {
    // This effect handles redirection for unauthenticated users.
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const productsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(100));
  }, [firestore]);

  const { data: chartData, isLoading: productsLoading } =
    useCollection<Product>(productsCollection);

  const filteredData = useMemo(() => {
    if (!chartData) return [];
    if (!searchTerm) {
      return chartData;
    }
    return chartData.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, chartData]);

  const handlePointClick = (productName: string) => {
    setHighlightedProduct(productName);
    const element = document.getElementById(`product-item-${productName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleItemClick = (productName: string) => {
    setHighlightedProduct(productName);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
        <p className="ml-4 text-muted-foreground">{t('verifyingAdminAccess')}</p>
      </div>
    );
  }

  // Show access denied for non-admins AFTER loading is complete.
  // This prevents flickering content.
  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <div className="flex flex-col items-center gap-1 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h3 className="text-2xl font-bold tracking-tight font-headline">
            {t('accessDeniedTitle')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('accessDeniedDescription')}
          </p>
        </div>
      </div>
    );
  }

  // This content will only be rendered for verified admins.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* <div className="lg:col-span-3">
        <AdSlot />
      </div> */}
      <div className="lg:col-span-2">
        <MatrixChart
          chartData={filteredData || []}
          onPointClick={handlePointClick}
          highlightedProduct={highlightedProduct}
        />
      </div>
      <div className="lg:col-span-1 flex flex-col gap-6">
        <ProductSearch
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
        <AdminProductList
          chartData={filteredData || []}
          loading={productsLoading}
          onItemClick={handleItemClick}
          highlightedProduct={highlightedProduct}
        />
      </div>
    </div>
  );
}
