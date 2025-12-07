import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['hu', 'en'],
  defaultLocale: 'hu',
  localePrefix: 'as-needed'
});

// Export navigation utilities that use your routing config
export const {Link, redirect, usePathname, useRouter, getPathname} = 
  createNavigation(routing);
