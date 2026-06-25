/**
 * Canonical trade limits — single source of truth for anti-abuse rules.
 * Referenced by: API routes, form validation, order creation, UI hints.
 *
 * Benchmarked against: Meru, Lemon Cash, Belo, Binance P2P, LocalBitcoins.
 * See docs/hackathon/REVENUE-MODEL.md § "Medidas anti-abuso" for rationale.
 */
export const TRADE_LIMITS = {
  /**
   * Dust floor — not a profitability floor (fixed costs don't scale per-op).
   * Prevents orderbook spam with sub-cent transactions. Any amount ≥ $1 USDC
   * contributes positively to covering fixed costs since marginal cost ≈ $0.
   */
  MIN_USDC: 1,

  /** Minutes the displayed rate is locked after a taker accepts an order. */
  RATE_LOCK_MINUTES: 10,

  /** Cancellations allowed per 24-hour window before cooldown kicks in. */
  MAX_CANCELS_PER_DAY: 3,

  /** Cooldown duration (hours) once cancellation limit is reached. */
  COOLDOWN_HOURS: 24,

  /** Max simultaneous open orders for accounts with fewer than 5 completed trades. */
  MAX_OPEN_ORDERS_NEW: 1,

  /** Max simultaneous open orders for established accounts (5+ trades). */
  MAX_OPEN_ORDERS_ESTABLISHED: 3,

  /** Daily USDC volume limit without extended KYC. Aligns with UIF informal threshold. */
  DAILY_LIMIT_USDC: 500,

  /** Minutes a maker has to fund the escrow after posting an order. */
  ESCROW_FUND_MINUTES: 30,

  /** Minimum completion rate required for makers with 10+ trades. Below this, maker-posting is suspended. */
  MIN_COMPLETION_RATE: 0.70,

  /** Max new orders per IP per hour. Basic bot/spam defense, enforced in middleware. */
  IP_ORDERS_PER_HOUR: 5,

  /** Number of completed trades required before completion rate is enforced. */
  COMPLETION_RATE_MIN_TRADES: 10,
} as const;

export type TradeLimits = typeof TRADE_LIMITS;
