// Shared rate types + client-side fetch. Replaces the hardcoded MOCK_RATE with a
// live USD/ARS rate sourced from (1) the Reflector on-chain oracle and (2) the
// BCRA official rate. Server-side reads live in `rates-server.ts`.

export type RateSource = 'contract' | 'reflector' | 'bcra' | 'fallback';

export interface RateSnapshot {
  /** Primary trading rate: ARS per 1 USD. */
  usdArs: number;
  /** Which source provided `usdArs`. */
  source: RateSource;
  /** Rate read via the p2p contract's reference_rate (on-chain oracle call), or null. */
  contract: number | null;
  /** On-chain Reflector oracle rate read directly (ARS per USD), or null. */
  reflector: number | null;
  /** BCRA official wholesale rate (ARS per USD), or null if unavailable. */
  bcraOfficial: number | null;
  /** ISO date/time the rate is valid as of. */
  asOf: string;
  /**
   * Platform buy rate: ARS a user pays to buy 1 USDC.
   * Derived from usdArs with spread + rounding applied (see pricing.ts).
   * Displayed in the UI instead of the raw oracle mid-rate.
   */
  buyRate: number;
  /**
   * Platform sell rate: ARS a user receives when selling 1 USDC.
   * Derived from usdArs with spread + rounding applied (see pricing.ts).
   */
  sellRate: number;
}

// Last-resort constant if both live sources fail. Matches the previous MOCK_RATE
// so behavior degrades gracefully rather than breaking the trade screens.
export const FALLBACK_USD_ARS = 1485;

export function fallbackSnapshot(): RateSnapshot {
  return {
    usdArs: FALLBACK_USD_ARS,
    source: 'fallback',
    contract: null,
    reflector: null,
    bcraOfficial: null,
    asOf: '',
    buyRate: FALLBACK_USD_ARS + 12,  // ~0.8% above fallback, rounded
    sellRate: FALLBACK_USD_ARS - 12, // ~0.8% below fallback, rounded
  };
}

/** Client-side: fetch the combined rate snapshot from our own API route. */
export async function fetchRateSnapshot(): Promise<RateSnapshot> {
  try {
    const res = await fetch('/api/rates', { cache: 'no-store' });
    if (!res.ok) throw new Error(`rates HTTP ${res.status}`);
    return (await res.json()) as RateSnapshot;
  } catch {
    return fallbackSnapshot();
  }
}
