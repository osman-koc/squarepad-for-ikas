'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

type Language = {
  code: 'tr' | 'en';
  name: string;
  flag: string;
};

const languages: Language[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const [currentLocale, setCurrentLocale] = useState<'tr' | 'en'>('tr');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get current locale from cookie
    const locale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];
    
    if (locale === 'tr' || locale === 'en') {
      setCurrentLocale(locale);
    }
  }, []);

  const handleLanguageChange = (languageCode: 'tr' | 'en') => {
    // Set cookie with 1 year expiration
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `NEXT_LOCALE=${languageCode}; path=/; expires=${expiryDate.toUTCString()}`;
    
    // Also set in localStorage as backup
    localStorage.setItem('NEXT_LOCALE', languageCode);
    
    // Reload page to apply new locale
    window.location.reload();
  };

  const currentLanguage = languages.find((lang) => lang.code === currentLocale) || languages[0];

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-accent ${
                    currentLocale === language.code ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => {
                    handleLanguageChange(language.code);
                    setIsOpen(false);
                  }}
                >
                  <span className="text-base">{language.flag}</span>
                  <span className="flex-1 text-left">{language.name}</span>
                  {currentLocale === language.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
