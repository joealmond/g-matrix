'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/routing';
import {routing} from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (newLocale: string) => {
    router.replace(pathname, {locale: newLocale});
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <Globe className="h-5 w-5" />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
          {routing.locales.map((loc) => (
            <Button
              key={loc}
              variant={locale === loc ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => handleChange(loc)}
            >
              {loc === 'en' ? 'English' : 'Magyar'}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
