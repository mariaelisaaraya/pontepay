'use client';

import EarnCard from '@/components/EarnCard';
import { useLanguage } from '@/contexts/LanguageContext';

export default function EarnPage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-120 px-4 py-6">
      <h1 className="mb-1 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-gray-900">
        {t('earn.title')}
      </h1>
      <p className="mb-5 text-sm text-gray-500">
        {t('earn.subtitle')}
      </p>
      <EarnCard />
    </div>
  );
}
