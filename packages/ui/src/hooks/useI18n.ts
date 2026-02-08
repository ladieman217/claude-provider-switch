import { useState, useCallback, useEffect } from 'react';
import { translations, getNestedValue, type Locale, type TranslationKey } from '../lib/i18n';

const STORAGE_KEY = 'cps-locale';

function getBrowserLocale(): Locale {
  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en';
}

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'zh-CN' || stored === 'en')) {
      return stored;
    }
  } catch {
    // Ignore localStorage errors
  }
  return getBrowserLocale();
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const t = useCallback((key: TranslationKey | string, params?: Record<string, string>) => {
    const translationSet = translations[locale];
    let value = getNestedValue(translationSet as Record<string, unknown>, key);

    if (!value) {
      // Fallback to English
      const englishSet = translations['en'];
      value = getNestedValue(englishSet as Record<string, unknown>, key);
    }

    if (!value) {
      return key;
    }

    // Replace parameters
    if (params) {
      let result = value;
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
      });
      return result;
    }

    return value;
  }, [locale]);

  return {
    locale,
    setLocale,
    t,
    isZh: locale === 'zh-CN',
    isEn: locale === 'en',
  };
}
