// AML / Fraud Risk Scorer — calibrated on SantanderAI/gen-fraud-graph patterns.
//
// gen-fraud-graph generates cyclic money-laundering rings where:
//   - Fraud transactions have amount == 9999.00 (structuring just below $10k CTR threshold)
//   - Fraud edges form closed cycles of depth 4-7 (round-trip flows)
//   - Suspicious descriptions include: "structuring deposit below threshold",
//     "round-trip transaction", "rapid movement of funds between accounts",
//     "layered transfer via intermediary", "dormant account sudden activity"
//
// We port these patterns to PeerlyPay's P2P USDC↔ARS domain:
//   - Structuring → amounts just below common reporting thresholds (USDC or ARS)
//   - Cycles → wallet appearing as both maker and counterparty in recent orders
//   - Velocity → high order frequency from the same address
//   - Large single transactions → high-value cross-border wire pattern

import type { Order } from '@/types';

// ─── Thresholds (calibrated from gen-fraud-graph) ─────────────────────────────

// USDC structuring window: $9,000–$9,999 (below US $10k CTR)
const USDC_STRUCT_LO = 9_000;
const USDC_STRUCT_HI = 9_999;

// ARS structuring window: below AFIP/COELSA $1M ARS reporting threshold
const ARS_STRUCT_LO = 900_000;
const ARS_STRUCT_HI = 999_999;

// High-value cross-border wire threshold (gen-fraud-graph "high-value" pattern)
const USDC_HIGH_VALUE = 5_000;

// Velocity: more than this many orders from the same wallet in 24 hours
const VELOCITY_WINDOW_MS = 24 * 60 * 60 * 1000;
const VELOCITY_THRESHOLD = 2;

// Round-trip window: look back this many ms for a reverse flow
const CYCLE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskFlag {
  code: string;
  label: string;
  weight: number;
}

export interface RiskResult {
  score: number;       // 0–100
  level: RiskLevel;
  flags: RiskFlag[];
  explanation: string;
}

// ─── Flag definitions ─────────────────────────────────────────────────────────

const FLAGS = {
  STRUCTURING_USDC: {
    code: 'STRUCTURING_USDC',
    label: 'Structuring — USDC amount near $10k CTR threshold',
    weight: 35,
  },
  STRUCTURING_ARS: {
    code: 'STRUCTURING_ARS',
    label: 'Structuring — ARS amount near $1M AFIP threshold',
    weight: 28,
  },
  ROUND_TRIP: {
    code: 'ROUND_TRIP',
    label: 'Cycle detected — wallet was counterparty in a recent reverse order',
    weight: 40,
  },
  HIGH_VELOCITY: {
    code: 'HIGH_VELOCITY',
    label: 'High velocity — multiple orders from same wallet in 24h',
    weight: 25,
  },
  HIGH_VALUE: {
    code: 'HIGH_VALUE',
    label: 'High-value cross-border wire',
    weight: 15,
  },
  FIRST_TIME: {
    code: 'FIRST_TIME',
    label: 'First-time participant — no prior order history',
    weight: 10,
  },
} as const satisfies Record<string, RiskFlag>;

// ─── Scorer ───────────────────────────────────────────────────────────────────

/**
 * Score a single order against the order history.
 * @param order - the order being evaluated
 * @param allOrders - all known orders (used for cycle/velocity detection)
 * @param nowMs - current timestamp in ms (injectable for tests)
 */
export function scoreOrder(
  order: Order,
  allOrders: Order[],
  nowMs: number = Date.now(),
): RiskResult {
  const flags: RiskFlag[] = [];
  const usdcAmount = order.amount;
  const arsEquivalent = usdcAmount * order.rate;
  const walletAddress = order.createdBy;
  const orderTime = new Date(order.createdAt).getTime();

  // ── 1. Structuring: USDC near $10k CTR threshold ─────────────────────────
  if (usdcAmount >= USDC_STRUCT_LO && usdcAmount <= USDC_STRUCT_HI) {
    flags.push(FLAGS.STRUCTURING_USDC);
  }

  // ── 2. Structuring: ARS equivalent near $1M AFIP threshold ───────────────
  if (arsEquivalent >= ARS_STRUCT_LO && arsEquivalent <= ARS_STRUCT_HI) {
    flags.push(FLAGS.STRUCTURING_ARS);
  }

  // ── 3. Cycle/round-trip detection ────────────────────────────────────────
  // gen-fraud-graph: cycle of depth 4-7. In P2P: wallet A creates a sell order,
  // then later appears as taker in a buy order from someone they traded with,
  // completing a loop. Simplified: wallet A appears as maker on the opposite
  // side within the lookback window.
  const cycleWindow = nowMs - CYCLE_WINDOW_MS;
  const hasRoundTrip = allOrders.some((o) => {
    if (o.id === order.id) return false;
    if (o.createdBy !== walletAddress) return false;
    if (new Date(o.createdAt).getTime() < cycleWindow) return false;
    // Opposite side (e.g., this order is 'sell', other is 'buy')
    return o.type !== order.type;
  });
  if (hasRoundTrip) {
    flags.push(FLAGS.ROUND_TRIP);
  }

  // ── 4. Velocity ───────────────────────────────────────────────────────────
  const velocityWindow = orderTime - VELOCITY_WINDOW_MS;
  const recentFromSameWallet = allOrders.filter(
    (o) =>
      o.id !== order.id &&
      o.createdBy === walletAddress &&
      new Date(o.createdAt).getTime() > velocityWindow,
  );
  if (recentFromSameWallet.length >= VELOCITY_THRESHOLD) {
    flags.push(FLAGS.HIGH_VELOCITY);
  }

  // ── 5. High-value single transaction ─────────────────────────────────────
  if (usdcAmount >= USDC_HIGH_VALUE) {
    flags.push(FLAGS.HIGH_VALUE);
  }

  // ── 6. First-time participant ─────────────────────────────────────────────
  const hasPriorOrders = allOrders.some(
    (o) => o.id !== order.id && o.createdBy === walletAddress,
  );
  if (!hasPriorOrders) {
    flags.push(FLAGS.FIRST_TIME);
  }

  // ── Aggregate score ────────────────────────────────────────────────────────
  const rawScore = flags.reduce((acc, f) => acc + f.weight, 0);
  const score = Math.min(100, rawScore);

  const level: RiskLevel =
    score >= 66 ? 'HIGH' : score >= 31 ? 'MEDIUM' : 'LOW';

  const explanation =
    flags.length === 0
      ? 'No AML indicators detected. Transaction appears normal.'
      : `${flags.length} indicator${flags.length > 1 ? 's' : ''} flagged: ${flags.map((f) => f.code).join(', ')}.`;

  return { score, level, flags, explanation };
}

// ─── Batch scoring (for admin monitoring) ────────────────────────────────────

export interface ScoredOrder {
  order: Order;
  risk: RiskResult;
}

export function scoreAllOrders(allOrders: Order[], nowMs?: number): ScoredOrder[] {
  return allOrders.map((order) => ({
    order,
    risk: scoreOrder(order, allOrders, nowMs),
  }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'HIGH':   return 'text-red-700 bg-red-50 border-red-200';
    case 'MEDIUM': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'LOW':    return 'text-lime-700 bg-lime-50 border-lime-200';
  }
}

export function riskLevelDot(level: RiskLevel): string {
  switch (level) {
    case 'HIGH':   return 'bg-red-500';
    case 'MEDIUM': return 'bg-amber-400';
    case 'LOW':    return 'bg-lime-500';
  }
}
