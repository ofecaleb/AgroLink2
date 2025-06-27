import { useState, useEffect } from 'react';
import { getTranslation } from '../lib/translations';
import type { Language } from '../types';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string, params?: Record<string, string>) => {
    return getTranslation(language, key, params);
  };

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return {
    language,
    changeLanguage,
    t
  };
}
