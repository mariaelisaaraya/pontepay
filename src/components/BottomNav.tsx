'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, TrendingUp, ClipboardList, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const tabs: { href: string; icon: typeof Home; labelKey: TranslationKey }[] = [
  { href: '/', icon: Home, labelKey: 'nav.home' },
  { href: '/marketplace', icon: ArrowLeftRight, labelKey: 'nav.market' },
  { href: '/earn', icon: TrendingUp, labelKey: 'nav.earn' },
  { href: '/orders', icon: ClipboardList, labelKey: 'nav.orders' },
  { href: '/profile', icon: User, labelKey: 'nav.profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-120 -translate-x-1/2 border-t border-[#f1f3f4] bg-white pb-safe"
      aria-label="Bottom navigation"
    >
      <div className="flex items-start justify-around py-2.5">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-3 transition-colors ${
                isActive
                  ? 'text-primary-500'
                  : 'text-[#737373]'
              }`}
            >
              <Icon className="size-6" strokeWidth={1.5} />
              <span className="text-[13px] font-normal leading-normal">{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
