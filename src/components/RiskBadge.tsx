'use client';

import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { riskLevelColor, riskLevelDot, type RiskLevel } from '@/lib/risk-score';

interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
  /** compact — one-liner chip; verbose — shows score too */
  size?: 'compact' | 'verbose';
  className?: string;
}

const ICON = {
  HIGH:   ShieldAlert,
  MEDIUM: ShieldAlert,
  LOW:    ShieldCheck,
} as const;

export default function RiskBadge({ level, score, size = 'compact', className }: RiskBadgeProps) {
  const Icon = ICON[level];

  if (size === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          riskLevelColor(level),
          className,
        )}
        title={`AML Risk: ${level} (score ${score}/100)`}
      >
        <span className={cn('size-1.5 rounded-full', riskLevelDot(level))} />
        {level}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2',
        riskLevelColor(level),
        className,
      )}
    >
      <Icon className="size-4 shrink-0" />
      <div>
        <p className="text-[12px] font-semibold leading-none">
          AML Risk: {level}
        </p>
        <p className="text-[10px] mt-0.5 opacity-75">
          Score {score}/100 · gen-fraud-graph model
        </p>
      </div>
    </div>
  );
}
