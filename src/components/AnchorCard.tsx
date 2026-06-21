'use client';

import { useEffect, useState } from 'react';
import { Landmark, Loader2, CheckCircle2 } from 'lucide-react';

interface AnchorInfo {
  domain: string;
  webAuthEndpoint: string | null;
  transferServer: string | null;
  signingKey: string | null;
  deposit: string[];
  withdraw: string[];
}

export default function AnchorCard() {
  const [info, setInfo] = useState<AnchorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/anchor/info')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: AnchorInfo) => {
        if (active) setInfo(d);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Anchor unreachable');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Landmark className="size-5 text-primary-500" />
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-gray-900">
          Fiat anchor (SEP-24)
        </h3>
        {info?.transferServer && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-lime-700">
            <CheckCircle2 className="size-3" /> Connected
          </span>
        )}
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" /> Reading anchor capabilities…
        </p>
      )}

      {error && !loading && <p className="text-sm text-red-500">Could not reach anchor: {error}</p>}

      {info && !loading && (
        <div className="space-y-3 text-sm">
          <Field label="Anchor" value={info.domain} mono />
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Deposit rails</p>
            <div className="flex flex-wrap gap-1">
              {info.deposit.length ? (
                info.deposit.map((c) => <Chip key={c}>{c}</Chip>)
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Withdraw rails</p>
            <div className="flex flex-wrap gap-1">
              {info.withdraw.length ? (
                info.withdraw.map((c) => <Chip key={c}>{c}</Chip>)
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {info.webAuthEndpoint && <Chip>SEP-10 auth</Chip>}
            {info.transferServer && <Chip>SEP-24 transfer</Chip>}
          </div>
          <p className="pt-1 text-xs text-gray-400">
            Live capabilities read on-chain/off-chain from the anchor TOML + SEP-24 info.
            Interactive deposit (SEP-10 wallet sign) is the next integration step.
          </p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className={mono ? 'font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900' : 'text-[13px] text-gray-900'}>
        {value}
      </span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
      {children}
    </span>
  );
}
