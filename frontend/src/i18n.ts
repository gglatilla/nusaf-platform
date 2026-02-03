import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async () => {
  // For now, always use English. Can be extended to detect from:
  // - User preferences stored in DB
  // - Browser Accept-Language header
  // - URL parameter or cookie
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
