'use client';

import { useMemo, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { scoreAllOrders, type RiskLevel } from '@/lib/risk-score';
import RiskBadge from '@/components/RiskBadge';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type HoldState = 'pending' | 'approved' | 'rejected';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortenAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function fmtArs(n: number) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AmlMonitorPage() {
  const orders = useStore((s) => s.orders);
  const [filter, setFilter] = useState<RiskLevel | 'ALL' | 'HOLD'>('ALL');
  const [holdStates, setHoldStates] = useState<Record<string, HoldState>>({});

  const scored = useMemo(() => scoreAllOrders(orders), [orders]);

  const counts = useMemo(() => ({
    HIGH:   scored.filter((s) => s.risk.level === 'HIGH').length,
    MEDIUM: scored.filter((s) => s.risk.level === 'MEDIUM').length,
    LOW:    scored.filter((s) => s.risk.level === 'LOW').length,
    HOLD:   scored.filter((s) => s.risk.requiresHold).length,
  }), [scored]);

  const visible = useMemo(() => {
    if (filter === 'HOLD') return scored.filter((s) => s.risk.requiresHold);
    if (filter === 'ALL') return scored;
    return scored.filter((s) => s.risk.level === filter);
  }, [scored, filter]);

  const sorted = useMemo(
    () =>
      [...visible].sort((a, b) => {
        const aHold = a.risk.requiresHold ? 1 : 0;
        const bHold = b.risk.requiresHold ? 1 : 0;
        if (bHold !== aHold) return bHold - aHold;
        const lvl = { HIGH: 2, MEDIUM: 1, LOW: 0 };
        const dl = lvl[b.risk.level] - lvl[a.risk.level];
        return dl !== 0 ? dl : b.risk.score - a.risk.score;
      }),
    [visible],
  );

  const setHold = (orderId: string, state: HoldState) =>
    setHoldStates((prev) => ({ ...prev, [orderId]: state }));

  return (
    <div className="space-y-6 pb-10 pt-6 px-4">
      {/* Header */}
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
          {' '}· umbral UIF 300k ARS
        </p>
      </div>

      {/* Summary cards — 4 columns */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setFilter(filter === 'HOLD' ? 'ALL' : 'HOLD')}
          className={cn(
            'rounded-2xl border p-3 text-left transition-all active:scale-95',
            filter === 'HOLD'
              ? 'border-orange-300 bg-orange-100 shadow-sm'
              : 'border-orange-200 bg-orange-50',
          )}
        >
          <div className="flex items-center gap-1 mb-1">
            <PauseCircle className="size-4 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Hold</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{counts.HOLD}</p>
        </button>

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
          <div className="flex items-center gap-1 mb-1">
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
          <div className="flex items-center gap-1 mb-1">
            <ShieldAlert className="size-4 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Med</span>
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
          <div className="flex items-center gap-1 mb-1">
            <ShieldCheck className="size-4 text-lime-500" />
            <span className="text-[10px] font-bold text-lime-600 uppercase tracking-wide">Low</span>
          </div>
          <p className="text-2xl font-bold text-lime-700">{counts.LOW}</p>
        </button>
      </div>

      {/* Methodology */}
      <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-3 text-[11px] text-sky-700 leading-relaxed">
        <p className="font-semibold mb-1">Modelo — gen-fraud-graph + ARCA/UIF</p>
        <ul className="space-y-0.5 list-disc list-inside opacity-80">
          <li><strong>UIF_REPORT_REQUIRED</strong> (+50 pts) — ARS ≥ $300k → retención manual obligatoria</li>
          <li><strong>ROUND_TRIP</strong> (+40 pts) — billetera aparece en ambos lados en 7 días</li>
          <li><strong>STRUCTURING_USDC</strong> (+35 pts) — monto $9,000–$9,999 USDC</li>
          <li><strong>STRUCTURING_ARS</strong> (+28 pts) — ARS $900k–$999k (bajo umbral ARCA $1M)</li>
          <li><strong>HIGH_VELOCITY</strong> (+25 pts) — &gt;2 órdenes misma billetera en 24h</li>
          <li><strong>HIGH_VALUE</strong> (+15 pts) — orden &gt;$5,000 USDC</li>
          <li><strong>FIRST_TIME</strong> (+10 pts) — sin historial previo</li>
        </ul>
        <p className="mt-1.5 opacity-60">Score ≥66 → HIGH · 31–65 → MEDIUM · 0–30 → LOW</p>
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No hay órdenes con este filtro.</div>
        ) : (
          sorted.map(({ order, risk }) => {
            const holdState = holdStates[order.id];
            const isHeld = risk.requiresHold;

            return (
              <div
                key={order.id}
                className={cn(
                  'rounded-xl border bg-white p-4 space-y-3',
                  isHeld && !holdState && 'border-orange-300 ring-1 ring-orange-200',
                  holdState === 'approved' && 'border-emerald-300 ring-1 ring-emerald-100',
                  holdState === 'rejected' && 'border-red-300 ring-1 ring-red-100 opacity-60',
                  !isHeld && 'border-gray-200',
                )}
              >
                {/* Hold banner */}
                {isHeld && (
                  <div className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold',
                    (!holdState || holdState === 'pending') && 'bg-orange-50 text-orange-700 border border-orange-200',
                    holdState === 'approved' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    holdState === 'rejected' && 'bg-red-50 text-red-700 border border-red-200',
                  )}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {(!holdState || holdState === 'pending') && <Clock className="size-3.5 shrink-0" />}
                      {holdState === 'approved' && <CheckCircle2 className="size-3.5 shrink-0" />}
                      {holdState === 'rejected' && <XCircle className="size-3.5 shrink-0" />}
                      <span className="truncate">
                        {!holdState && `Retención UIF — ${fmtArs(risk.arsEquivalent)} ARS`}
                        {holdState === 'pending' && `Retenida — ${fmtArs(risk.arsEquivalent)} ARS · pendiente`}
                        {holdState === 'approved' && `Aprobada por dispute_resolver`}
                        {holdState === 'rejected' && `Rechazada — orden bloqueada`}
                      </span>
                    </div>
                    {(!holdState || holdState === 'pending') && (
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setHold(order.id, 'pending')}
                          className="rounded-md bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-700 hover:bg-orange-200 transition-colors"
                        >
                          Retener
                        </button>
                        <button
                          type="button"
                          onClick={() => setHold(order.id, 'approved')}
                          className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-200 transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => setHold(order.id, 'rejected')}
                          className="rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-200 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                )}

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

                {/* Order details */}
                <div className="flex items-center justify-between text-[12px] text-gray-600">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold uppercase text-[10px] text-gray-700">
                    {order.type}
                  </span>
                  <span className="font-[family-name:var(--font-jetbrains-mono)] font-semibold text-gray-900">
                    {order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
                  </span>
                  <span className="text-gray-500 text-[11px]">≈ {fmtArs(risk.arsEquivalent)} ARS</span>
                  <span className="text-gray-400">{order.paymentMethodLabel}</span>
                </div>

                {/* Flags */}
                {risk.flags.length > 0 ? (
                  <div className="space-y-1">
                    {risk.flags.map((flag) => (
                      <div
                        key={flag.code}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2.5 py-1.5',
                          flag.code === 'UIF_REPORT_REQUIRED' ? 'bg-orange-50' : 'bg-gray-50',
                        )}
                      >
                        <ShieldAlert className={cn(
                          'size-3.5 shrink-0',
                          flag.code === 'UIF_REPORT_REQUIRED' ? 'text-orange-500' : 'text-amber-500',
                        )} />
                        <span className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-bold text-gray-700">
                          {flag.code}
                        </span>
                        <span className="text-[11px] text-gray-500 flex-1 min-w-0 truncate">
                          {flag.label}
                        </span>
                        <span className={cn(
                          'text-[10px] font-bold shrink-0',
                          flag.code === 'UIF_REPORT_REQUIRED' ? 'text-orange-600' : 'text-amber-600',
                        )}>
                          +{flag.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-lime-600">
                    <Shield className="size-3.5" />
                    Sin indicadores detectados
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
