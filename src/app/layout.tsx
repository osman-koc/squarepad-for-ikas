import './globals.css';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { LocaleSync } from '@/components/LocaleSync';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/square-logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/square-logo.svg" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <LocaleSync />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 
