'use client';

import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const productsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(100));
  }, [firestore]);

  const { data: chartData, isLoading: productsLoading } =
    useCollection<Product>(productsCollection);

  return (
    <AdminDashboard
      chartData={chartData || []}
      loading={productsLoading}
    />
  );
}
