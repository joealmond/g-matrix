
'use client';
import { AdSlot } from '@/components/dashboard/ad-slot';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { ProductList } from '@/components/dashboard/product-list';
import { ProductSearch } from '@/components/dashboard/product-search';
import { useCollectionOnce, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { QUADRANT_SAFETY_THRESHOLD, QUADRANT_TASTE_THRESHOLD } from '@/lib/config';

// Quadrant definitions (using thresholds from config)
type QuadrantFilter = 'all' | 'holyGrail' | 'survivorFood' | 'russianRoulette' | 'theBin';

const quadrantConfig = {
  holyGrail: { minTaste: QUADRANT_TASTE_THRESHOLD, maxTaste: 100, minSafety: QUADRANT_SAFETY_THRESHOLD, maxSafety: 100, color: 'bg-green-500' },
  survivorFood: { minTaste: 0, maxTaste: QUADRANT_TASTE_THRESHOLD, minSafety: QUADRANT_SAFETY_THRESHOLD, maxSafety: 100, color: 'bg-yellow-500' },
  russianRoulette: { minTaste: QUADRANT_TASTE_THRESHOLD, maxTaste: 100, minSafety: 0, maxSafety: QUADRANT_SAFETY_THRESHOLD, color: 'bg-red-500' },
  theBin: { minTaste: 0, maxTaste: QUADRANT_TASTE_THRESHOLD, minSafety: 0, maxSafety: QUADRANT_SAFETY_THRESHOLD, color: 'bg-gray-500' },
};

export default function Home() {
  const t = useTranslations('Home');
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantFilter>('all');
  const firestore = useFirestore();

  const productsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(100));
  }, [firestore]);

  const { data: chartData, isLoading: loading } = useCollectionOnce<Product>(productsCollection);

  const filteredData = useMemo(() => {
    if (!chartData) return [];
    
    let data = chartData;
    
    // Apply search filter
    if (searchTerm) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply quadrant filter
    if (quadrantFilter !== 'all') {
      const config = quadrantConfig[quadrantFilter];
      data = data.filter(item => 
        item.avgTaste >= config.minTaste && 
        item.avgTaste < config.maxTaste &&
        item.avgSafety >= config.minSafety && 
        item.avgSafety < config.maxSafety
      );
    }
    
    return data;
  }, [searchTerm, chartData, quadrantFilter]);

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

  const handleQuadrantClick = (quadrant: QuadrantFilter) => {
    setQuadrantFilter(current => current === quadrant ? 'all' : quadrant);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* <div className="lg:col-span-3">
        <AdSlot />
      </div> */}
      <div className="lg:col-span-2 space-y-4">
        <MatrixChart
          chartData={filteredData || []}
          onPointClick={handlePointClick}
          highlightedProduct={highlightedProduct}
        />
        
        {/* Quadrant Quick Filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            variant={quadrantFilter === 'holyGrail' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuadrantClick('holyGrail')}
            className={quadrantFilter === 'holyGrail' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            {t('holyGrail')}
          </Button>
          <Button 
            variant={quadrantFilter === 'survivorFood' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuadrantClick('survivorFood')}
            className={quadrantFilter === 'survivorFood' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
            {t('survivorFood')}
          </Button>
          <Button 
            variant={quadrantFilter === 'russianRoulette' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuadrantClick('russianRoulette')}
            className={quadrantFilter === 'russianRoulette' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            {t('russianRoulette')}
          </Button>
          <Button 
            variant={quadrantFilter === 'theBin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleQuadrantClick('theBin')}
            className={quadrantFilter === 'theBin' ? 'bg-gray-500 hover:bg-gray-600' : ''}
          >
            <span className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
            {t('theBin')}
          </Button>
          {quadrantFilter !== 'all' && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setQuadrantFilter('all')}
            >
              {t('clearFilter')}
            </Button>
          )}
        </div>
      </div>
      <div className="lg:col-span-1 flex flex-col gap-6">
         <ProductSearch searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
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
