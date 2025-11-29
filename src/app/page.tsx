'use client';
import { AdSlot } from '@/components/dashboard/ad-slot';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { ProductList } from '@/components/dashboard/product-list';
import { ProductSearch } from '@/components/dashboard/product-search';
import { useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';

export default function Home() {
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();

  const productsCollection = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);

  const { data: chartData, loading } = useCollection<Product>(productsCollection);

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

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <AdSlot />
      </div>
      <div className="lg:col-span-3">
        <MatrixChart
          chartData={filteredData || []}
          onPointClick={handlePointClick}
          highlightedProduct={highlightedProduct}
        />
      </div>
      <div className="lg:col-span-3">
        <ProductSearch searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
      </div>
      <div className="lg:col-span-3">
        <ProductList
          chartData={filteredData || []}
          loading={loading}
          onItemClick={handleItemClick}
          highlightedProduct={highlightedProduct}
        />
      </div>
    </div>
  );
}
