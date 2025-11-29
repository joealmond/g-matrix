'use client';
import { AdSlot } from '@/components/dashboard/ad-slot';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { ProductList } from '@/components/dashboard/product-list';
import { ProductSearch } from '@/components/dashboard/product-search';
import { useState } from 'react';

const chartData = [
  { product: 'Udis Gluten Free Bread', safety: 85, taste: 70 },
  { product: 'Canyon Bakehouse Bread', safety: 95, taste: 90 },
  { product: 'King Arthur Flour', safety: 98, taste: 95 },
  { product: 'Bobs Red Mill Flour', safety: 92, taste: 88 },
  { product: 'Cheerios', safety: 40, taste: 80 },
  { product: 'Snyders GF Pretzels', safety: 75, taste: 92 },
  { product: 'Katz Donuts', safety: 88, taste: 85 },
  { product: 'Oreo Gluten Free', safety: 60, taste: 98 },
  { product: 'Cardboard Box', safety: 10, taste: 5 },
  { product: 'Mystery Meat', safety: 20, taste: 90 },
  { product: 'Safe but Bland Crackers', safety: 95, taste: 20 },
];

export default function Home() {
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(null);

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
        <MatrixChart chartData={chartData} onPointClick={handlePointClick} highlightedProduct={highlightedProduct} />
      </div>
       <div className="lg:col-span-3">
        <ProductSearch />
      </div>
       <div className="lg:col-span-3">
        <ProductList chartData={chartData} onItemClick={handleItemClick} highlightedProduct={highlightedProduct} />
      </div>
    </div>
  );
}
