'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from '@/i18n/translations';

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'pontepay_lang';
const DEFAULT_LANG: Lang = 'es';

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Lazy init — this tree renders client-side only (Privy provider is
  // ssr:false), so reading localStorage here is safe and avoids a flash of
  // the wrong language.
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return DEFAULT_LANG;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'es' || stored === 'en' ? stored : DEFAULT_LANG;
  });

  const toggleLang = useCallback(() => {
    setLang((current) => {
      const next: Lang = current === 'es' ? 'en' : 'es';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // preference just won't persist
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => translations[lang][key] ?? translations.en[key] ?? key,
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
