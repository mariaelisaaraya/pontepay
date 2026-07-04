'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Shield, ShieldAlert, ShieldCheck, ExternalLink } from 'lucide-react';
import { useStore } from '@/lib/store';
import { scoreAllOrders, type RiskLevel } from '@/lib/risk-score';
import RiskBadge from '@/components/RiskBadge';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortenAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

// Internal dashboard: only logged-in users. Falls open when Privy is not
// configured (local dev without NEXT_PUBLIC_PRIVY_APP_ID — the provider is
// absent then, so usePrivy would crash anyway).
const PRIVY_ENABLED = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

function LoggedInGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) router.replace('/');
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;
  return <>{children}</>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AmlMonitorPage() {
  const content = <AmlMonitorContent />;
  return PRIVY_ENABLED ? <LoggedInGate>{content}</LoggedInGate> : content;
}

function AmlMonitorContent() {
  const orders = useStore((s) => s.orders);
  const [filter, setFilter] = useState<RiskLevel | 'ALL'>('ALL');

  const scored = useMemo(() => scoreAllOrders(orders), [orders]);

  const counts = useMemo(() => ({
    HIGH:   scored.filter((s) => s.risk.level === 'HIGH').length,
    MEDIUM: scored.filter((s) => s.risk.level === 'MEDIUM').length,
    LOW:    scored.filter((s) => s.risk.level === 'LOW').length,
  }), [scored]);

  const visible = useMemo(
    () => filter === 'ALL' ? scored : scored.filter((s) => s.risk.level === filter),
    [scored, filter],
  );

  // Sort: HIGH first, then MEDIUM, then LOW; within same level sort by score desc
  const sorted = useMemo(
    () =>
      [...visible].sort((a, b) => {
        const lvl = { HIGH: 2, MEDIUM: 1, LOW: 0 };
        const dl = lvl[b.risk.level] - lvl[a.risk.level];
        return dl !== 0 ? dl : b.risk.score - a.risk.score;
      }),
    [visible],
  );

  return (
    <div className="space-y-6 pb-10 pt-6 px-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-gray-900">
            AML Risk Monitor
          </h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Powered by{' '}
            <a
              href="https://github.com/SantanderAI/gen-fraud-graph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline inline-flex items-center gap-0.5"
            >
              SantanderAI/gen-fraud-graph <ExternalLink className="size-3" />
            </a>
            {' '}· cycle detection, structuring, velocity
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setFilter(filter === 'HIGH' ? 'ALL' : 'HIGH')}
          className={cn(
            'rounded-2xl border p-3 text-left transition-all active:scale-95',
            filter === 'HIGH'
              ? 'border-red-300 bg-red-100 shadow-sm'
              : 'border-red-200 bg-red-50',
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert className="size-4 text-red-500" />
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">High</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{counts.HIGH}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
          className={cn(
            'rounded-2xl border p-3 text-left transition-all active:scale-95',
            filter === 'MEDIUM'
              ? 'border-amber-300 bg-amber-100 shadow-sm'
              : 'border-amber-200 bg-amber-50',
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert className="size-4 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Medium</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{counts.MEDIUM}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'LOW' ? 'ALL' : 'LOW')}
          className={cn(
            'rounded-2xl border p-3 text-left transition-all active:scale-95',
            filter === 'LOW'
              ? 'border-lime-300 bg-lime-100 shadow-sm'
              : 'border-lime-200 bg-lime-50',
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldCheck className="size-4 text-lime-500" />
            <span className="text-[10px] font-bold text-lime-600 uppercase tracking-wide">Low</span>
          </div>
          <p className="text-2xl font-bold text-lime-700">{counts.LOW}</p>
        </button>
      </div>

      {/* Methodology note */}
      <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-3 text-[11px] text-sky-700 leading-relaxed">
        <p className="font-semibold mb-1">Detection model — gen-fraud-graph patterns</p>
        <ul className="space-y-0.5 list-disc list-inside opacity-80">
          <li><strong>STRUCTURING_USDC</strong> (+35 pts) — amount $9,000–$9,999 (below $10k CTR threshold)</li>
          <li><strong>STRUCTURING_ARS</strong> (+28 pts) — ARS equivalent $900k–$999k (AFIP threshold)</li>
          <li><strong>ROUND_TRIP</strong> (+40 pts) — wallet appears on both sides of a 7-day window</li>
          <li><strong>HIGH_VELOCITY</strong> (+25 pts) — &gt;2 orders from same wallet in 24h</li>
          <li><strong>HIGH_VALUE</strong> (+15 pts) — single order &gt;$5,000 USDC</li>
          <li><strong>FIRST_TIME</strong> (+10 pts) — no prior order history</li>
        </ul>
        <p className="mt-1.5 opacity-60">Score ≥66 → HIGH · 31–65 → MEDIUM · 0–30 → LOW</p>
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No orders match this filter.</div>
        ) : (
          sorted.map(({ order, risk }) => (
            <div
              key={order.id}
              className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 text-sm">
                  {order.createdBy.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight">
                    {order.displayName ?? shortenAddress(order.createdBy)}
                  </p>
                  <p className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-gray-400 truncate">
                    {order.createdBy}
                  </p>
                </div>
                <RiskBadge level={risk.level} score={risk.score} size="verbose" />
              </div>

              {/* Order details row */}
              <div className="flex items-center justify-between text-[12px] text-gray-600">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold uppercase text-[10px] text-gray-700">
                  {order.type}
                </span>
                <span className="font-[family-name:var(--font-jetbrains-mono)] font-semibold text-gray-900">
                  {order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
                </span>
                <span>{order.rate.toLocaleString('en-US')} {order.fiatCurrencyLabel}/USDC</span>
                <span className="text-gray-400">{order.paymentMethodLabel}</span>
              </div>

              {/* Flags */}
              {risk.flags.length > 0 ? (
                <div className="space-y-1">
                  {risk.flags.map((flag) => (
                    <div
                      key={flag.code}
                      className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5"
                    >
                      <ShieldAlert className="size-3.5 text-amber-500 shrink-0" />
                      <span className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-bold text-gray-700">
                        {flag.code}
                      </span>
                      <span className="text-[11px] text-gray-500 flex-1 min-w-0 truncate">
                        {flag.label}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 shrink-0">
                        +{flag.weight}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-lime-600">
                  <Shield className="size-3.5" />
                  No indicators detected
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
