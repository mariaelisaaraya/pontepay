'use client';

import AnchorCard from '@/components/AnchorCard';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AnchorPage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-120 px-4 py-6">
      <h1 className="mb-1 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-gray-900">
        {t('anchor.title')}
      </h1>
      <p className="mb-3 text-sm text-gray-500">
        {t('anchor.explainer')}
      </p>
      <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        {t('anchor.testnetNote')}
      </p>
      <AnchorCard />
    </div>
  );
}
