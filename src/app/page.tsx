import { AdSlot } from '@/components/dashboard/ad-slot';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { ProductSearch } from '@/components/dashboard/product-search';

export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <ProductSearch />
      </div>
      <div className="lg:col-span-3">
        <MatrixChart />
      </div>
      <div className="lg:col-span-3">
        <AdSlot />
      </div>
    </div>
  );
}
