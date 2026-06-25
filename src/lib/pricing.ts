// Platform pricing engine — spread-based revenue model.
//
// Revenue is captured by embedding our margin into the exchange rate shown to
// users rather than displaying an explicit "platform fee" line. This matches
// industry practice: Foxbit (stablecoin invisible rails), Meru (dynamic rate
// in-app), and most LatAm fintechs do not expose a separate fee for FX.
//
// Model:
//   - Spread: 0.80% on each side (buy and sell)
//   - Rounding: displayed rate snaps to nearest ROUND_STEP_ARS (5 ARS)
//     so the rate looks like a clean market quote, not a calculated number.
//
// Competitive context (jun 2026):
//   - Meru:         1% + $1 USD per crypto deposit
//   - Lemon Cash:   ~1.2–1.5% effective (unverified)
//   - PontePay:    0.80% spread (cheaper than Meru, invisible like Foxbit)

export const SPREAD_BPS = 80;       // 0.80 %
export const ROUND_STEP_ARS = 5;    // round displayed rate to nearest 5 ARS

/** Round value UP to the nearest `step`. Used for buy rates: user pays more. */
export function roundUp(value: number, step = ROUND_STEP_ARS): number {
  return Math.ceil(value / step) * step;
}

/** Round value DOWN to the nearest `step`. Used for sell rates: user receives less. */
export function roundDown(value: number, step = ROUND_STEP_ARS): number {
  return Math.floor(value / step) * step;
}

/**
 * Rate the user pays in ARS to buy 1 USDC.
 * Higher than mid-rate → platform captures the difference.
 * e.g. mid = 1,461 ARS → buyRate = ceil(1,461 × 1.008 / 5) × 5 = 1,475
 */
export function applyBuySpread(midRate: number): number {
  return roundUp(midRate * (1 + SPREAD_BPS / 10_000));
}

/**
 * Rate the user receives in ARS when selling 1 USDC.
 * Lower than mid-rate → platform captures the difference.
 * e.g. mid = 1,461 ARS → sellRate = floor(1,461 × 0.992 / 5) × 5 = 1,449
 */
export function applySellSpread(midRate: number): number {
  return roundDown(midRate * (1 - SPREAD_BPS / 10_000));
}

export interface PlatformRates {
  /** Oracle mid-market rate. Never displayed directly. */
  midRate: number;
  /** Rate shown when user wants to buy USDC (they pay this many ARS per USDC). */
  buyRate: number;
  /** Rate shown when user wants to sell USDC (they receive this many ARS per USDC). */
  sellRate: number;
  /** Spread width in basis points (informational). */
  spreadBps: number;
  /** ARS per USDC spread width (buy minus sell). */
  spreadArs: number;
}

/** Derive all platform-facing rates from a single oracle mid-price. */
export function getPlatformRates(midRate: number): PlatformRates {
  const buyRate = applyBuySpread(midRate);
  const sellRate = applySellSpread(midRate);
  return {
    midRate,
    buyRate,
    sellRate,
    spreadBps: SPREAD_BPS,
    spreadArs: buyRate - sellRate,
  };
}
