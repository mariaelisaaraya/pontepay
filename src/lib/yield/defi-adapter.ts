// Pattern #6: DeFi adapter — pluggable liquidity backend.
//
// Background (sebastianlujan/challenge):
//   The repo defines a trait-based adapter pattern that lets the app swap DeFi
//   backends (Soroswap, Aquarius, Blend) without changing business logic.
//   Each adapter exposes the same async interface; the caller never knows which
//   protocol is behind the call.
//
// Adapters implemented here:
//   - SoroswapAdapter  — query USDC/XLM price via Soroswap aggregator
//   - AquariusAdapter  — query USDC pool price via Aquarius AMM (AQUA rewards)
//   - BlendAdapter     — check Blend USDC liquidity and earn-rate
//   - MockAdapter      — deterministic stub for tests and demo mode
//
// Usage:
//   import { getBestRate, type LiquidityAdapter } from '@/lib/yield/defi-adapter';
//   const rate = await getBestRate('USDC', 'XLM', 100);
//
// Extending:
//   Implement LiquidityAdapter and push to ADAPTERS — no other changes needed.

// ─── Interface ────────────────────────────────────────────────────────────────

export interface QuoteResult {
  adapter: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  pricePerUnit: number;
  feePercent: number;
  slippageBps: number;
  source: string;
}

export interface LiquidityInfo {
  adapter: string;
  tvlUsdc: number;
  earnRateApr: number;
  source: string;
}

export interface LiquidityAdapter {
  readonly name: string;
  readonly isAvailable: () => Promise<boolean>;
  getQuote: (fromAsset: string, toAsset: string, amount: number) => Promise<QuoteResult>;
  getLiquidity: () => Promise<LiquidityInfo>;
}

// ─── Soroswap adapter ─────────────────────────────────────────────────────────
// Soroswap aggregator aggregates Stellar Classic DEX + Aquarius + Phoenix.
// Their API: https://aggregator.soroswap.finance (no auth required for quotes)

const SOROSWAP_API = 'https://aggregator.soroswap.finance';

class SoroswapAdapter implements LiquidityAdapter {
  readonly name = 'Soroswap';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${SOROSWAP_API}/api/health`, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuote(fromAsset: string, toAsset: string, amount: number): Promise<QuoteResult> {
    // Soroswap quote endpoint (check aggregator docs for current path)
    const url = `${SOROSWAP_API}/api/quote?from=${encodeURIComponent(fromAsset)}&to=${encodeURIComponent(toAsset)}&amount=${amount}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`[Soroswap] quote failed: ${res.status}`);
    const data = await res.json() as { outputAmount?: number; fee?: number };
    const toAmount = data.outputAmount ?? 0;
    return {
      adapter: this.name,
      fromAsset,
      toAsset,
      fromAmount: amount,
      toAmount,
      pricePerUnit: toAmount / amount,
      feePercent: data.fee ?? 0.3,
      slippageBps: 50,
      source: url,
    };
  }

  async getLiquidity(): Promise<LiquidityInfo> {
    return { adapter: this.name, tvlUsdc: 0, earnRateApr: 0, source: SOROSWAP_API };
  }
}

// ─── Aquarius adapter ─────────────────────────────────────────────────────────
// Aquarius exposes pool stats at https://aqua.network/api

const AQUARIUS_API = 'https://aqua.network/api';

class AquariusAdapter implements LiquidityAdapter {
  readonly name = 'Aquarius';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${AQUARIUS_API}/pools/`, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuote(fromAsset: string, toAsset: string, amount: number): Promise<QuoteResult> {
    const url = `${AQUARIUS_API}/pools/?assets=${encodeURIComponent(fromAsset)},${encodeURIComponent(toAsset)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`[Aquarius] pool query failed: ${res.status}`);
    const data = await res.json() as { results?: Array<{ price?: number; fee?: number }> };
    const pool = data.results?.[0];
    const price = pool?.price ?? 1;
    const toAmount = amount * price;
    return {
      adapter: this.name,
      fromAsset,
      toAsset,
      fromAmount: amount,
      toAmount,
      pricePerUnit: price,
      feePercent: pool?.fee ?? 0.3,
      slippageBps: 30,
      source: url,
    };
  }

  async getLiquidity(): Promise<LiquidityInfo> {
    try {
      const url = `${AQUARIUS_API}/pools/?asset=USDC&limit=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`[Aquarius] liquidity fetch failed: ${res.status}`);
      const data = await res.json() as { results?: Array<{ tvl_usdc?: number; apy?: number }> };
      const pool = data.results?.[0];
      return {
        adapter: this.name,
        tvlUsdc: pool?.tvl_usdc ?? 0,
        earnRateApr: pool?.apy ?? 0,
        source: url,
      };
    } catch {
      return { adapter: this.name, tvlUsdc: 0, earnRateApr: 0, source: AQUARIUS_API };
    }
  }
}

// ─── Blend adapter ────────────────────────────────────────────────────────────
// Blend Protocol: https://docs.blend.capital/
// Stats available at https://mainnet.blend.capital (no public REST yet in Jun 2026,
// but the SDK reads directly from the Soroban contracts).

class BlendAdapter implements LiquidityAdapter {
  readonly name = 'Blend';

  async isAvailable(): Promise<boolean> {
    // Blend is on mainnet only; we mark it unavailable on testnet
    const passphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? '';
    return passphrase.includes('Public');
  }

  async getQuote(fromAsset: string, toAsset: string, amount: number): Promise<QuoteResult> {
    // Blend doesn't offer spot swaps — it offers borrow/lend rates.
    // Return a synthetic "quote" based on the current borrow rate for toAsset.
    return {
      adapter: this.name,
      fromAsset,
      toAsset,
      fromAmount: amount,
      toAmount: amount, // 1:1 for lending (no swap)
      pricePerUnit: 1,
      feePercent: 0,
      slippageBps: 0,
      source: 'https://blend.capital',
    };
  }

  async getLiquidity(): Promise<LiquidityInfo> {
    // Real Blend TVL would be fetched from the Blend Pool contracts via Soroban RPC.
    // Placeholder until the Blend JS SDK is added to this repo.
    return {
      adapter: this.name,
      tvlUsdc: 0,
      earnRateApr: 0,
      source: 'https://blend.capital',
    };
  }
}

// ─── Mock adapter ─────────────────────────────────────────────────────────────

class MockAdapter implements LiquidityAdapter {
  readonly name = 'Mock';

  async isAvailable(): Promise<boolean> { return true; }

  async getQuote(fromAsset: string, toAsset: string, amount: number): Promise<QuoteResult> {
    return {
      adapter: this.name,
      fromAsset,
      toAsset,
      fromAmount: amount,
      toAmount: amount * 1.001,
      pricePerUnit: 1.001,
      feePercent: 0.1,
      slippageBps: 10,
      source: 'mock',
    };
  }

  async getLiquidity(): Promise<LiquidityInfo> {
    return { adapter: this.name, tvlUsdc: 1_000_000, earnRateApr: 0.05, source: 'mock' };
  }
}

// ─── Registry + routing ───────────────────────────────────────────────────────

const ADAPTERS: LiquidityAdapter[] = [
  new SoroswapAdapter(),
  new AquariusAdapter(),
  new BlendAdapter(),
  new MockAdapter(),
];

/**
 * Returns all adapters that are currently reachable.
 */
export async function getAvailableAdapters(): Promise<LiquidityAdapter[]> {
  const results = await Promise.allSettled(
    ADAPTERS.map(async (a) => ({ adapter: a, available: await a.isAvailable() })),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<{ adapter: LiquidityAdapter; available: boolean }> =>
        r.status === 'fulfilled' && r.value.available,
    )
    .map((r) => r.value.adapter);
}

/**
 * Returns the best quote across all available adapters (highest toAmount).
 * Falls back to MockAdapter if no live adapter is reachable.
 */
export async function getBestRate(
  fromAsset: string,
  toAsset: string,
  amount: number,
): Promise<QuoteResult> {
  const available = await getAvailableAdapters();

  const quotes = await Promise.allSettled(
    available
      .filter((a) => a.name !== 'Mock') // prefer real adapters
      .map((a) => a.getQuote(fromAsset, toAsset, amount)),
  );

  const fulfilled = quotes
    .filter((r): r is PromiseFulfilledResult<QuoteResult> => r.status === 'fulfilled')
    .map((r) => r.value);

  if (fulfilled.length > 0) {
    return fulfilled.reduce((best, q) => (q.toAmount > best.toAmount ? q : best));
  }

  // Fallback: mock
  return new MockAdapter().getQuote(fromAsset, toAsset, amount);
}

/**
 * Returns liquidity info from the first available non-Mock adapter.
 */
export async function getLiquidityInfo(preferAdapter?: string): Promise<LiquidityInfo> {
  const available = await getAvailableAdapters();
  const target = preferAdapter
    ? available.find((a) => a.name === preferAdapter)
    : available.find((a) => a.name !== 'Mock');

  if (target) return target.getLiquidity();
  return new MockAdapter().getLiquidity();
}
