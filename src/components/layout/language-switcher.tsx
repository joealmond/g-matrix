
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.replace(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <Globe className="h-5 w-5" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg">
          <Button
            variant={locale === 'en' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleLanguageChange('en')}
          >
            English
          </Button>
          <Button
            variant={locale === 'hu' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleLanguageChange('hu')}
          >
            Magyar
          </Button>
        </div>
      )}
    </div>
  );
}
