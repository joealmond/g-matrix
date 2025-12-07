import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!['en', 'hu'].includes(locale)) {
    locale = 'en';
  }
  
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});