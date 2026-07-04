'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function DemoBanner() {
  const { t } = useLanguage();
  return (
    <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
      <span aria-hidden>🎭</span>
      <span>{t('trade.demoBanner')}</span>
    </div>
  );
}
