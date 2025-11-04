'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

function Loading() {
  const t = useTranslations('common');
  
  return (
    <div className="relative w-full h-[100svh] box-border flex items-center justify-center text-2xl font-medium">
      <div>{t('loading')}</div>
    </div>
  );
}

export default Loading;
