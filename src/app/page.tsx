import { AdSlot } from '@/components/dashboard/ad-slot';
import { MatrixChart } from '@/components/dashboard/matrix-chart';
import { ProductSearch } from '@/components/dashboard/product-search';
import { TrendingFoods } from '@/components/dashboard/trending-foods';
import { VotingPanel } from '@/components/dashboard/voting-panel';

export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <ProductSearch />
      </div>
      <div className="lg:col-span-2">
        <MatrixChart />
      </div>
      <div className="lg:col-span-1 space-y-6">
        <VotingPanel />
        <TrendingFoods />
      </div>
      <div className="lg:col-span-3">
        <AdSlot />
      </div>
    </div>
  );
}
