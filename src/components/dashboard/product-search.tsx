'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {useTranslations} from 'next-intl';

interface ProductSearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export function ProductSearch({ searchTerm, onSearchTermChange }: ProductSearchProps) {
  const t = useTranslations('ProductSearch');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('findYourVibe')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            className="w-full pl-8"
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
