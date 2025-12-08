/**
 * React Hooks for i18n
 * 
 * Provides React hooks for accessing translations in components.
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, supportedLocales, TranslationKeys } from './index';
import enTranslations from './locales/en.json';

// Load translations dynamically
const translations: Record<Locale, TranslationKeys> = {
  en: enTranslations as TranslationKeys,
  // Add other locales as they're implemented
  fr: enTranslations as TranslationKeys, // Placeholder
  es: enTranslations as TranslationKeys, // Placeholder
  de: enTranslations as TranslationKeys, // Placeholder
  ja: enTranslations as TranslationKeys, // Placeholder
  zh: enTranslations as TranslationKeys, // Placeholder
};

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * Get nested value from object by dot-notation key
 */
function getNestedValue(obj: any, key: string): string | undefined {
  const keys = key.split('.');
  let value = obj;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return typeof value === 'string' ? value : undefined;
}

/**
 * Replace parameters in translation string
 */
function replaceParams(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  
  let result = str;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  
  return result;
}

/**
 * Translation function
 */
function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const localeTranslations = translations[locale] || translations[defaultLocale];
  const translation = getNestedValue(localeTranslations, key);
  
  if (!translation) {
    // Fallback to key if translation not found
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  
  return replaceParams(translation, params);
}

/**
 * I18n Provider Component
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return defaultLocale;
    
    // Check localStorage
    const stored = localStorage.getItem('locale');
    if (stored && supportedLocales.includes(stored as Locale)) {
      return stored as Locale;
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (supportedLocales.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }
    
    return defaultLocale;
  });

  const setLocale = (newLocale: Locale) => {
    if (!supportedLocales.includes(newLocale)) {
      console.warn(`Locale ${newLocale} is not supported`);
      return;
    }
    
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      // Update HTML lang attribute
      document.documentElement.lang = newLocale;
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };

  // Update HTML lang attribute when locale changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access i18n context
 */
export function useTranslation() {
  const context = useContext(I18nContext);
  
  if (!context) {
    // Fallback if provider is not used
    return {
      locale: defaultLocale,
      t: (key: string, params?: Record<string, string | number>) => {
        return translate(defaultLocale, key, params);
      },
      setLocale: () => {},
    };
  }
  
  return context;
}

/**
 * Hook to get current locale
 */
export function useLocale() {
  const { locale } = useTranslation();
  return locale;
}

/**
 * Hook to translate a specific key
 */
export function useT() {
  const { t } = useTranslation();
  return t;
}
