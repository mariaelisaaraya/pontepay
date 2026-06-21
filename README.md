<div align="center">
  <img src="public/images/banner.png" alt="PeerlyPay banner" width="100%" />
  <br />
  <br />
  <img src="public/icon-fuchsia.svg" alt="PeerlyPay logo" width="120" />
  <h1>PeerlyPay 🌍💸</h1>
  <p><strong>Earn Global, Spend Local.</strong></p>
  <p>A mobile-first, <strong>non-custodial</strong> P2P marketplace to trade USDC on Stellar ⇄ Argentine peso (ARS) — for remote workers, freelancers, and digital nomads who earn in crypto and spend in local fiat.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Stellar-111111?style=flat-square&logo=stellar&logoColor=white" alt="Stellar" />
    <img src="https://img.shields.io/badge/Soroban_Rust-0F172A?style=flat-square&logo=rust&logoColor=white" alt="Soroban" />
    <img src="https://img.shields.io/badge/Reflector_Oracle-7C3AED?style=flat-square&logoColor=white" alt="Reflector" />
    <img src="https://img.shields.io/badge/Crossmint-00A3FF?style=flat-square&logoColor=white" alt="Crossmint" />
    <img src="https://img.shields.io/badge/License-MIT-22C55E?style=flat-square" alt="MIT" />
  </p>

  <p><em>Built for the Stellar <strong>PULSO Argentina</strong> hackathon.</em></p>
</div>

---

## 🧑‍⚖️ For judges — start here

**🌐 Live app: https://peerlypay-two.vercel.app** · **Pitch:** [docs/hackathon/PITCH.md](docs/hackathon/PITCH.md) · **Demo script:** [docs/hackathon/DEMO_SCRIPT.md](docs/hackathon/DEMO_SCRIPT.md)

> Try **demo mode** straight away — open the app, go to **Marketplace**, click any order, and walk the full flow with no wallet needed.

**Two ways to evaluate, in 2 minutes:**

1. **Demo mode — no wallet, no setup.** Open the app → **Marketplace** (pre-populated with
   labeled demo orders). Click any order and walk the *real* screens end-to-end —
   **Confirm** (live rate with an `oracle` tag) → **Payment** (interoperable
   **Transferencias 3.0 QR**) → **Waiting** → **Success** — with no on-chain transaction.
2. **Real on-chain path.** Connect a **Crossmint** wallet (email signer, Stellar testnet);
   the same flow then executes **real Soroban contract writes** and polls the chain.

**Verify the load-bearing Stellar integration directly:**

| What to check | Where |
|---|---|
| Live ARS/USD rate read **through our contract → Reflector oracle** | `GET /api/rates` → `{"source":"contract", …}` |
| Deployed p2p escrow contract (testnet) | [`CC2CA5…76TJ`](https://stellar.expert/explorer/testnet/contract/CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ) |
| Live SEP-24 anchor capabilities | `GET /api/anchor/info` · in-app at `/anchor` |
| Contract test suite | `cargo test -p p2p` → **20/20 passing** |

Engineering source of truth: **[docs/hackathon/CONTEXT.md](docs/hackathon/CONTEXT.md)** · Submission map: **[SUBMISSION_CHECKLIST.md](docs/hackathon/SUBMISSION_CHECKLIST.md)**

---

## What is PeerlyPay?

Argentina runs on two currencies: people **earn and save in dollars** but **spend in pesos**,
under persistent inflation and capital controls. Stablecoins already make up **over half of all
ARS exchange purchases** ([Chainalysis, 2025](https://www.chainalysis.com/blog/latin-america-crypto-adoption-2025/)),
and Argentina is **#2 in Latin America** by crypto volume. Yet the on/off-ramp is still painful:
KYC-heavy CEXs, custodial wallets, OTC desks, and opaque spreads.

**PeerlyPay** is a **non-custodial, peer-to-peer marketplace** to swap **USDC on Stellar** for
**ARS** (and back). The dollar side stays trustless on Stellar; the peso side settles off-chain
where Argentine fiat lives; and a **Soroban smart contract is the only thing that ever holds
funds** while a trade is in flight.

> **Earn Global, Spend Local.**

**The flow (self-custodial):**

1. A **creator** posts an order — *sell crypto for fiat* or *buy crypto with fiat*.
2. A **taker** fills it (full or partial).
3. The on-chain USDC is **escrowed in the Soroban contract** — never in a company wallet.
4. One side proves an **off-chain fiat payment** (ARS bank transfer / Transferencias 3.0).
5. The contract **releases the escrowed USDC** to the correct party.
6. On a dispute, an on-chain **`dispute_resolver`** settles it (`resolve_dispute`).

---

## ⭐ Why Stellar — the load-bearing integration

Stellar isn't a logo on a slide here; it's the mechanism that makes the product trustworthy.
Every core value prop **only exists because of the Soroban contract and the on-chain oracle.**

| Building block | Role in PeerlyPay | Where |
|---|---|---|
| **Soroban P2P escrow** | Holds USDC per order; enforces the full state machine (create → take → submit fiat → confirm/dispute/timeout → release/refund). The trust anchor. | `contracts/contracts/p2p` |
| **Reflector oracle (SEP-40)** | `reference_rate` makes a **cross-contract call** to the Reflector fiat oracle for the live ARS/USD rate. The price is **read on-chain**, not set by an admin or hardcoded. | `contracts/contracts/p2p/src/core/oracle.rs` |
| **Crossmint smart wallets** | Email-signer Stellar smart wallets — no seed-phrase friction — sign every escrow write. | `src/lib/p2p-crossmint.ts` |
| **SEP-24 anchor** | Reads a live anchor's on/off-ramp capabilities (SEP-1 TOML + SEP-24 `/info`). | `src/lib/sep24.ts`, `src/app/anchor` |
| **Transferencias 3.0 QR** | Interoperable EMVCo (CRC16) QR for the BCRA instant-rail ARS leg that triggers escrow release. | `src/components/trade/Transferencias30QR.tsx` |

### Headline: an on-chain rate, mediated by our own contract

Most P2P ramps quote a rate from a backend an operator controls. PeerlyPay reads it **on-chain**:

- The contract is configured (via `set_oracle`) to point at the **Reflector SEP-40 fiat oracle**
  — testnet `CCSSO…NV4W`, mainnet `CBKGPWGK…CJZC`.
- **`reference_rate(2)`** (`2` = ARS) does a **cross-contract call** into Reflector, reads the
  latest ARS price, inverts it on-chain, and returns the live **ARS-per-USD** rate (~**1461**).
  This replaced a previous hardcoded `MOCK_RATE = 1485`.
- The frontend reads the rate **through the contract** (`GET /api/rates`), with a graceful
  fallback chain: **our contract `reference_rate` → direct Reflector → BCRA official API →
  constant**. Verified live: `contract = 1461`, `reflector = 1461.92`, `bcraOfficial = 1461`.
- **BCRA transparency:** the same endpoint also fetches Argentina's central-bank official USD/ARS
  rate, surfacing the gap between the official and the market rate.

```jsonc
// GET /api/rates  (live)
{ "usdArs": 1461, "source": "contract", "contract": 1461,
  "reflector": 1461.92, "bcraOfficial": 1461, "asOf": "…" }
```

### Deployed contract

| | |
|---|---|
| **Contract ID** | `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ` |
| **Network** | Stellar Testnet (`Test SDF Network ; September 2015`) |
| **Oracle** | Reflector SEP-40 fiat oracle (set via `set_oracle`) |
| **Tests** | `cargo test -p p2p` → **20/20 passing** (incl. 2 oracle tests) |

**Entrypoints:** `initialize`, `pause`/`unpause`, `create_order`/`create_order_cli`,
`cancel_order`, `take_order`/`take_order_with_amount`, `submit_fiat_payment`,
`execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`,
`resolve_dispute`, `get_order`/`get_order_count`, `get_config`, `set_oracle`, `get_oracle`,
`reference_rate`.

---

## How it works

Two on-chain roles per order — the **creator** (posts) and the **taker** (fills). One party
proves the fiat leg; the contract releases the crypto leg.

**Selling crypto for pesos (`from_crypto = true`)**
1. Creator posts a sell order; their USDC is locked in escrow on `create_order`.
2. Taker fills it (`take_order_with_amount`, partial fills supported — leftover reopens).
3. Taker pays ARS off-chain (bank transfer or by scanning the **Transferencias 3.0 QR**) and
   calls `submit_fiat_payment`.
4. Creator confirms receipt (`confirm_fiat_payment`) → contract **releases USDC to the taker**.

**Buying crypto with pesos (`from_crypto = false`)**
1. Creator posts a buy order; the **taker deposits** USDC into escrow on take.
2. Creator sends ARS off-chain and submits payment.
3. Taker confirms receipt → contract **releases USDC to the creator**.

If a counterparty stalls, anyone on the paying side can trigger
`execute_fiat_transfer_timeout`; on a dispute, the `dispute_resolver` settles with
`resolve_dispute`.

---

## Architecture

Two halves in one repo: the **Next.js app at the root (`src/`)** and the **Soroban workspace
(`contracts/`)**.

```text
src/
├── app/
│   ├── api/
│   │   ├── rates/route.ts         # GET /api/rates — contract → reflector → BCRA → fallback
│   │   ├── anchor/info/route.ts   # GET /api/anchor/info — live SEP-1 TOML + SEP-24 /info
│   │   └── match-order/route.ts   # order matching helper
│   ├── marketplace/               # browse open orders (OrderCard → real trade flow)
│   ├── orders/[id]/               # order detail (reads real chain data)
│   ├── trade/{confirm,payment,waiting,success}/   # the real flow + demo mode (?demo=1)
│   ├── anchor/                    # SEP-24 anchor discovery page
│   └── profile/                   # profile + liquidity-provider views
├── components/
│   ├── trade/Transferencias30QR.tsx   # EMVCo / Transferencias 3.0 QR (CRC16)
│   ├── AnchorCard.tsx · OrderCard.tsx · …
├── lib/
│   ├── contract-config.ts         # single source of truth for the contract id (read + write)
│   ├── p2p.ts                     # read path: get_order, reference_rate, …
│   ├── p2p-crossmint.ts           # write path: take/submit/confirm/createOrderWithCrossmint
│   ├── rates.ts · rates-server.ts · useLiveRate.ts   # live rate (oracle + BCRA)
│   ├── sep24.ts                   # SEP-1 / SEP-24 anchor reading
│   └── store.ts                   # Zustand store (+ labeled demo orders fallback)
└── types/

contracts/contracts/p2p/src/
├── contract.rs · lib.rs           # entrypoints + wiring
├── core/order.rs                  # order lifecycle
├── core/oracle.rs                 # Reflector SEP-40 cross-contract call (set_oracle/reference_rate)
├── core/dispute.rs · core/admin.rs · core/validators/
├── events/handler.rs · storage/types.rs
└── tests/test.rs                  # 20/20 passing
```

> **`contract-config.ts`** fixes a real bug: the read (`p2p.ts`) and write (`p2p-crossmint.ts`)
> paths previously fell back to *different* contract ids — the app read one contract and wrote
> to another. They now resolve to the same id.

---

## Run it locally

### Frontend

```bash
cp .env.example .env.local     # then fill in the values (see below)
npm install
npm run dev                    # http://localhost:3000
```

Required env (`.env.example` documents all of them):

| Variable | Value (testnet) |
|---|---|
| `NEXT_PUBLIC_CROSSMINT_API_KEY` | your `ck_…` key from the Crossmint console |
| `NEXT_PUBLIC_P2P_CONTRACT_ID` | `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` |
| `NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID` | `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W` |

### Contract (build via WSL/Linux)

```bash
cargo test -p p2p                                   # 20/20
cargo build -p p2p --target wasm32v1-none --release # deployable wasm
```

> On Windows, the native host has no C linker — build the contract via **WSL/Linux**. Full
> deploy + `set_oracle` + bindings steps are in [docs/hackathon/MAINNET_DEPLOY.md](docs/hackathon/MAINNET_DEPLOY.md).

### Deploy the app

Use **Vercel** (the app has server route handlers — GitHub Pages won't work). Full guide,
env table, and Crossmint domain-allowlist gotcha: [docs/hackathon/DEPLOY_FRONTEND.md](docs/hackathon/DEPLOY_FRONTEND.md).

---

## ⚠️ Current limitations (honest disclosure)

The escrow, the on-chain oracle rate, the real Crossmint writes, and the SEP-24 discovery are
**real and live on testnet**. The following are **not** complete — disclosed because the rubric
rewards honesty:

- **Interactive SEP-24 deposit/withdraw** — anchor discovery is live; the SEP-10 wallet-signed
  deposit is **scaffolded** (`src/lib/sep24.ts`).
- **Cross-chain (Base / Slice) dispute** — aspirational; the real dispute path is **single-chain**
  via the contract's `dispute_resolver`.
- **Trustline check** (`checkUSDCTrustline`) — currently a stub returning `true`.
- **No backend** — trade history / profile / reputation live in `localStorage` + Zustand.
- **Demo orders** — when the chain has no orders, the marketplace shows labeled **demo** orders so
  the flow is always testable; redeploy from your admin and seed real orders for production.

---

## 🎯 How this maps to the PULSO judging criteria

| Criterion | Evidence |
|---|---|
| **Integration depth & technical complexity** | Soroban escrow + **cross-contract call** to a Reflector SEP-40 oracle for the on-chain rate; Crossmint smart-wallet writes; SEP-24 anchor reads. 20/20 contract tests. |
| **Impact on the Stellar ecosystem** | A non-custodial USDC↔ARS ramp for a market where stablecoins are >50% of ARS exchange purchases; uses three recommended Stellar building blocks (Soroban, Reflector, SEP-24). |
| **Customer discovery & validation** | Interview guide + findings template: [docs/hackathon/CUSTOMER_DISCOVERY.md](docs/hackathon/CUSTOMER_DISCOVERY.md). |
| **Quality of testnet/mainnet deployment** | Live testnet contract `CC2CA5…76TJ`, verifiable on `stellar.expert`; reproducible deploy guide; live `/api/rates` reading through the contract. |

---

## Roadmap

- [ ] Complete the interactive SEP-24 signed deposit/withdraw (SEP-10 challenge via Crossmint).
- [ ] Real USDC trustline check + enablement flow.
- [ ] Mainnet deployment (Reflector mainnet oracle already known) + first real orders.
- [ ] On-chain rate-band validation in `create_order` (reject orders far from the oracle).
- [ ] Reputation/identity (portable, on-chain) and a lightweight indexer/backend.

---

## Team

**Leo · Barb · Eli** — built for the Stellar PULSO Argentina hackathon.

---

## License

MIT.

---

<div align="center"><sub>Built with ❤️ for Stellar · Argentina 🇦🇷</sub></div>
