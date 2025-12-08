/**
 * Internationalization (i18n) System
 * 
 * Provides a lightweight i18n solution for externalizing user-facing strings.
 * Ready for future integration with next-intl or similar libraries.
 */

export type Locale = 'en' | 'fr' | 'es' | 'de' | 'ja' | 'zh';

export const defaultLocale: Locale = 'en';

export const supportedLocales: Locale[] = ['en'];

/**
 * Translation keys structure
 * This should match the structure in locale files
 */
export interface TranslationKeys {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    update: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    filter: string;
    sort: string;
    actions: string;
    more: string;
  };
  navigation: {
    home: string;
    docs: string;
    cookbooks: string;
    pricing: string;
    enterprise: string;
    community: string;
    support: string;
    playground: string;
    getStarted: string;
  };
  forms: {
    required: string;
    invalidEmail: string;
    invalidUrl: string;
    minLength: string;
    maxLength: string;
    passwordMismatch: string;
    submit: string;
    submitting: string;
    reset: string;
  };
  errors: {
    generic: string;
    network: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    tryAgain: string;
    contactSupport: string;
  };
  emptyStates: {
    noData: string;
    noResults: string;
    noItems: string;
    createFirst: string;
  };
  buttons: {
    create: string;
    save: string;
    saveChanges: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    viewDashboard: string;
    getStarted: string;
    learnMore: string;
  };
}

/**
 * Translation function type
 */
export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Translation context
 */
export interface I18nContextValue {
  locale: Locale;
  t: TranslateFunction;
  setLocale: (locale: Locale) => void;
}

/**
 * Simple translation function
 * Loads translations from locale files
 */
import enTranslations from './locales/en.json';

const translations: Record<Locale, any> = {
  en: enTranslations,
  // Add other locales as they're implemented
  fr: enTranslations, // Placeholder
  es: enTranslations, // Placeholder
  de: enTranslations, // Placeholder
  ja: enTranslations, // Placeholder
  zh: enTranslations, // Placeholder
};

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

export function translate(
  key: string,
  locale: Locale = defaultLocale,
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
 * Get locale from browser or storage
 */
export function getLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  // Check localStorage first
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
}

/**
 * Set locale preference
 */
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('locale', locale);
  // In a full implementation, this would trigger a re-render
}
