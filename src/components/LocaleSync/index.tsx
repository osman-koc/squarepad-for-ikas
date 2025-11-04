'use client';

import { useEffect } from 'react';

/**
 * Syncs locale from localStorage to cookie on client-side
 * This is necessary for iframe environments where cookies might not work properly
 */
export function LocaleSync() {
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const storedLocale = localStorage.getItem('NEXT_LOCALE');
    
    if (storedLocale === 'tr' || storedLocale === 'en') {
      console.log('[LocaleSync] Syncing locale from localStorage:', storedLocale);
      
      // Set cookie
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      try {
        // Try with SameSite=None for iframe support
        document.cookie = `NEXT_LOCALE=${storedLocale}; path=/; expires=${expiryDate.toUTCString()}; SameSite=None; Secure`;
        console.log('[LocaleSync] Cookie set successfully');
      } catch (error) {
        console.error('[LocaleSync] Failed to set cookie:', error);
      }
    } else {
      // No stored locale, set default
      console.log('[LocaleSync] No stored locale, setting default: tr');
      localStorage.setItem('NEXT_LOCALE', 'tr');
    }
  }, []);

  return null; // This component doesn't render anything
}
