import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'hu'],
  defaultLocale: 'en'
});

// Export navigation utilities that use your routing config
export const {Link, redirect, usePathname, useRouter, getPathname} = 
  createNavigation(routing);
