// Platform pricing engine — decreasing-fee spread model with launch offer.
//
// Fee schedule — decreasing tiers, any amount accepted:
//
//   Amount (USDC)  │ Spread BPS │ Effective % │ Use case
//   ───────────────┼────────────┼─────────────┼──────────────────────────
//      < $10       │   250 bps  │    2.5%     │ micro-pagos, splits
//   $10 – $50      │   150 bps  │    1.5%     │ pagos cotidianos
//   $50 – $200     │   100 bps  │    1.0%     │ P2P estándar, remesas
//   $200 +         │    80 bps  │    0.8%     │ ahorro, volumen
//
// Marginal cost per tx ≈ $0.000012 (Stellar fee only).
// Every tx with spread > 0 is profitable. Tiers are competitive positioning.
//
// Launch offer: 0% spread until LAUNCH_OFFER_EXPIRES.
// Users see the exact oracle mid-rate. Flip off by advancing the date.

export const ROUND_STEP_ARS = 5;

// ── Launch offer ─────────────────────────────────────────────────────────────

/**
 * Launch offer control — via environment variables, no code changes needed.
 *
 * To activate:   set NEXT_PUBLIC_LAUNCH_OFFER=true  in Vercel dashboard
 * To deactivate: set NEXT_PUBLIC_LAUNCH_OFFER=false (or delete the var)
 *
 * Optionally set NEXT_PUBLIC_LAUNCH_OFFER_EXPIRES to an ISO date string
 * (e.g. "2026-10-01") to auto-expire on a known date once mainnet launches.
 * If not set, the offer stays active as long as the flag is true.
 */
export function isLaunchOfferActive(): boolean {
  if (process.env.NEXT_PUBLIC_LAUNCH_OFFER !== 'true') return false;
  const expires = process.env.NEXT_PUBLIC_LAUNCH_OFFER_EXPIRES;
  if (!expires) return true;
  return new Date() < new Date(expires);
}

/** Days remaining in the launch offer (null if no expiry date is set). */
export function launchOfferDaysLeft(): number | null {
  const expires = process.env.NEXT_PUBLIC_LAUNCH_OFFER_EXPIRES;
  if (!expires) return null;
  const ms = new Date(expires).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// ── Fee tiers ─────────────────────────────────────────────────────────────────

export interface FeeTier {
  minUsdc: number;
  spreadBps: number;
  label: string;
}

export const FEE_TIERS: readonly FeeTier[] = [
  { minUsdc:   0, spreadBps: 250, label: 'Micro'    },  // < $10   → 2.5%
  { minUsdc:  10, spreadBps: 150, label: 'Pequeño'  },  // $10–$50  → 1.5%
  { minUsdc:  50, spreadBps: 100, label: 'Estándar' },  // $50–$200 → 1.0%
  { minUsdc: 200, spreadBps:  80, label: 'Pro'      },  // $200+    → 0.8%
] as const;

const LAUNCH_TIER: FeeTier = { minUsdc: 0, spreadBps: 0, label: 'Lanzamiento 🎉' };

/** Backward-compatible constant — spread for the Standard tier. */
export const SPREAD_BPS = 100;

export function getFeeTier(amountUsdc: number): FeeTier {
  if (isLaunchOfferActive()) return LAUNCH_TIER;
  let active = FEE_TIERS[0];
  for (const tier of FEE_TIERS) {
    if (amountUsdc >= tier.minUsdc) active = tier;
  }
  return active;
}

export function getSpreadBps(amountUsdc: number): number {
  return getFeeTier(amountUsdc).spreadBps;
}

// ── Rounding helpers ──────────────────────────────────────────────────────────

export function roundUp(value: number, step = ROUND_STEP_ARS): number {
  return Math.ceil(value / step) * step;
}

export function roundDown(value: number, step = ROUND_STEP_ARS): number {
  return Math.floor(value / step) * step;
}

export function applyBuySpread(midRate: number): number {
  return roundUp(midRate * (1 + SPREAD_BPS / 10_000));
}

export function applySellSpread(midRate: number): number {
  return roundDown(midRate * (1 - SPREAD_BPS / 10_000));
}

// ── Rate output ───────────────────────────────────────────────────────────────

export interface PlatformRates {
  midRate:        number;
  buyRate:        number;
  sellRate:       number;
  spreadBps:      number;
  spreadArs:      number;
  tierLabel:      string;
  isLaunchOffer:  boolean;
  launchDaysLeft: number;
}

/** Standard tier rates — used when amount is unknown. */
export function getPlatformRates(midRate: number): PlatformRates {
  const buy  = applyBuySpread(midRate);
  const sell = applySellSpread(midRate);
  return {
    midRate, buyRate: buy, sellRate: sell,
    spreadBps: SPREAD_BPS, spreadArs: buy - sell,
    tierLabel: 'Estándar',
    isLaunchOffer: false, launchDaysLeft: 0,
  };
}

/**
 * Amount-aware rates — picks tier automatically.
 * During launch offer: buyRate = sellRate = midRate (0% spread).
 */
export function getPlatformRatesForAmount(midRate: number, amountUsdc: number): PlatformRates {
  const tier      = getFeeTier(amountUsdc);
  const factor    = tier.spreadBps / 10_000;
  const buy       = factor === 0 ? midRate : roundUp(midRate * (1 + factor));
  const sell      = factor === 0 ? midRate : roundDown(midRate * (1 - factor));
  const launch    = isLaunchOfferActive();
  return {
    midRate, buyRate: buy, sellRate: sell,
    spreadBps: tier.spreadBps, spreadArs: buy - sell,
    tierLabel: tier.label,
    isLaunchOffer: launch,
    launchDaysLeft: launch ? launchOfferDaysLeft() : 0,
  };
}
