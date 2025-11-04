'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Props for HomePage component
interface HomePageProps {
  token: string | null;
  storeName?: string;
}

/**
 * HomePage component
 */
const HomePage: React.FC<HomePageProps> = ({ token, storeName }) => {
  const t = useTranslations();

  if (!token) {
    return (
      <div className="max-w-[1200px] mx-auto p-6 bg-background min-h-[100vh]">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center p-20 bg-muted rounded-xl border border-dashed">
          <h3 className="text-lg font-semibold mb-2">{t('auth.required')}</h3>
          <p className="text-muted-foreground">{t('auth.requiredMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6 bg-background min-h-[100vh]">
      <div className="flex justify-end mb-4">
        <LanguageSwitcher />
      </div>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-green-600" size={56} />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{t('home.congratulations')}</h2>
          <p className="mt-2 text-muted-foreground">
            {t('home.authenticatedTo')} <span className="font-medium">{storeName}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
