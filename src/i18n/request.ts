import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'tr';

export default getRequestConfig(async () => {
  // First, try to get locale from middleware header
  const headersList = await headers();
  const localeFromHeader = headersList.get('x-locale');
  
  // Fallback to cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  
  // Determine the locale
  let locale: Locale = defaultLocale;
  
  if (localeFromHeader && locales.includes(localeFromHeader as Locale)) {
    locale = localeFromHeader as Locale;
  } else if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  }

  console.log('[i18n] Header locale:', localeFromHeader);
  console.log('[i18n] Cookie locale:', localeCookie);
  console.log('[i18n] Selected locale:', locale);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
