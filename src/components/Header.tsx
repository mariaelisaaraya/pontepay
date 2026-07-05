'use client';

import Image from 'next/image';
import { Globe } from 'lucide-react';
import WalletButton from '@/components/WalletButton';
import { useLanguage } from '@/contexts/LanguageContext';

// Discreet language toggle: a ghost pill with a globe + current locale.
// One tap flips ES <-> EN — with two languages a menu would be overkill.
function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a español'}
      className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
    >
      <Globe className="size-3.5" strokeWidth={2} />
      {lang}
    </button>
  );
}

export default function Header() {
  return (
    <header className="fixed top-0 left-1/2 z-50 w-full max-w-120 -translate-x-1/2 border-b bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src="/pontepay-logo.svg"
            alt="PontePay"
            width={28}
            height={28}
            className="shrink-0 object-contain h-7 w-7"
          />
          <span className="font-display font-bold text-xl truncate">
            PontePay
          </span>
        </div>

        {/* Language + wallet */}
        <div className="flex items-center gap-1.5">
          <LanguageToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
