# PeerlyPay — CONTEXT (Single Source of Truth)

> Handoff notes for the team and any future contributor.
> This doc captures the **real vs mock** state, key on-chain IDs, the architecture map,
> build/run/deploy steps, and the open items before the **PULSO Argentina** submission
> (deadline **2026-06-30**). When in doubt, this file wins. Update it as you ship.

**Last verified:** 2026-06-20 · **Branch:** `main`

### Related hackathon docs (cross-reference)
- [`PITCH.md`](./PITCH.md) — 10-slide pitch deck script (Spanish, for the Buenos Aires IRL pitch Jul 6).
- This doc (`CONTEXT.md`) — engineering source of truth / handoff.
- _(To be added before submission: `README.md` at repo root with mocks disclosure, `CUSTOMER_DISCOVERY.md`, demo video link.)_

---

## 1. Current state summary (real vs mock)

PeerlyPay is a **mobile-first, non-custodial P2P marketplace** to trade **USDC (Stellar) ↔ Argentine peso (ARS)**. A creator posts an order, a taker fills it, one side proves an off-chain fiat payment, and the on-chain USDC is escrowed in a Soroban contract and released. Disputes are resolved on-chain by a single `dispute_resolver`.

### ✅ Real now (verified this week)

| Area | What's real |
|---|---|
| **Soroban escrow contract** | `p2p` contract **deployed on testnet** (`CC2CA5…76TJ`). Entrypoints: `initialize`, `pause`/`unpause`, `create_order(_cli)`, `cancel_order`, `take_order(_with_amount)`, `submit_fiat_payment`, `execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`, `resolve_dispute`, `get_order(_count)`, `get_config`, and oracle ones: `set_oracle`, `get_oracle`, `reference_rate`. **20/20 Rust tests pass** (incl. 2 oracle tests). |
| **On-chain oracle (headline depth feature)** | Contract configured via `set_oracle` to the **Reflector SEP-40** fiat exchange-rate oracle. `reference_rate(2 = ARS)` performs a **cross-contract call** to Reflector and returns the live ARS-per-USD rate (~1461). This **replaced** a hardcoded `MOCK_RATE = 1485`. |
| **Frontend reads live rate THROUGH our contract** | `GET /api/rates` → `{ usdArs, source: "contract", contract, reflector, bcraOfficial, asOf }`. Fallback chain: **our contract `reference_rate` → direct Reflector read → BCRA official API → constant**. Verified live: contract=1461, reflector=1461.92, bcraOfficial=1461. |
| **BCRA official rate** | `/api/rates` also fetches Argentina's central bank official USD/ARS (off-chain reference; surfaces the gap vs market rate). |
| **Real trade flow** | `/trade/confirm → /trade/payment → /trade/waiting → /trade/success` with **real Crossmint contract writes** (`takeOrderWithCrossmint`, `submitFiatPaymentWithCrossmint`, `confirmFiatPaymentWithCrossmint`, `createOrderWithCrossmint`) and **5s on-chain polling**. Marketplace `OrderCard` and the order detail page route into this real flow and read real chain data (no more fake auto-advancing simulation). |
| **SEP-24 anchor discovery** | `/anchor` reads the SDF testnet anchor (`testanchor.stellar.org`) live capabilities via `/api/anchor/info` (SEP-1 TOML + SEP-24 `/info`): USDC deposit/withdraw enabled, SEP-10 auth + SEP-24 transfer server present. |
| **Transferencias 3.0 QR** | Payment screen renders an **EMVCo MPM interoperable QR** (CRC16/CCITT) representing a BCRA Transferencias 3.0 payment request for the ARS amount — the off-chain fiat leg that triggers escrow release. |
| **Contract-ID unified** | Read and write paths now resolve to the same contract via `src/lib/contract-config.ts` (fixed a real deployment bug where reads/writes diverged). |

### ⚠️ Mock / scaffold / aspirational (disclose honestly — the rubric rewards this)

| Area | Status |
|---|---|
| **Interactive SEP-24 deposit/withdraw** | **Scaffolded, not completed.** Discovery/`info` is live; the SEP-10 wallet-signed challenge → signed deposit is the next step (`Sep24DepositRequest` in `src/lib/sep24.ts`). |
| **Cross-chain Base/Slice dispute resolution** | **Docs-only / aspirational.** The **real** dispute path is **single-chain** via the contract's `dispute_resolver` (`resolve_dispute`). Do not present Base/Slice as built. |
| **Trustline check** (`checkUSDCTrustline`) | **Stub returning `true`.** |
| **Bank details, maker names, reputation/trust scores** | **Placeholder.** There is **no backend** — state lives in `localStorage` / Zustand (`src/lib/store.ts`). |
| **Deployed testnet instance** | Uses a **throwaway admin key** and has **no seeded orders**. For the real demo, redeploy from a funded admin identity and seed orders (`make p2p-seed-orders`), then set `NEXT_PUBLIC_P2P_CONTRACT_ID`. |
| **Older Trustless-Work escrow crate** | Exists in the repo but **not wired** to the app. The `p2p` contract is the live one. (Reference docs in [`docs/trustless-work/`](../trustless-work/).) |

---

## 2. Key facts table

| Fact | Value |
|---|---|
| **p2p contract (testnet)** | `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ` |
| **Deployer / admin address** | `GCEWWA6ZDQEBDADDXGHDM5FVN3PIIKWGRGOUO5IYTK7MSWAGQOYTTSK3` *(throwaway — redeploy from your own funded identity for the demo)* |
| **USDC token contract** | `CBIELTK6…` *(set via `TOKEN_CONTRACT_ID` at init / `NEXT_PUBLIC` token env)* |
| **Reflector oracle (testnet)** | `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W` |
| **Reflector oracle (mainnet)** | `CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC` |
| **ARS asset index (Reflector)** | `2` → `reference_rate(2)` returns ARS-per-USD (~1461) |
| **BCRA official rate endpoint** | `https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD` |
| **SDF testnet anchor domain** | `testanchor.stellar.org` (SEP-1 / SEP-10 / SEP-24, USDC) |
| **soroban-sdk** | `23.1.1` |
| **Fallback constant rate** | `FALLBACK_USD_ARS = 1485` (last-resort only) |
| **Contract id env override** | `NEXT_PUBLIC_P2P_CONTRACT_ID` (defaults to the testnet id above) |
| **Anchor domain env override** | `NEXT_PUBLIC_SEP24_ANCHOR_DOMAIN` (defaults to `testanchor.stellar.org`) |

> Note: `CBIELTK6…` and `CC2CA5…76TJ` are the canonical short forms used across docs; full ids live in `src/lib/contract-config.ts` and the contracts `Makefile`.

---

## 3. Architecture map

### Frontend (`src/`)

**App routes (`src/app/`)**

| Route | Purpose |
|---|---|
| `/` (`page.tsx`) | Landing / dashboard entry. |
| `/marketplace` | Order book; `OrderCard` routes into the **real** trade flow. |
| `/orders`, `/orders/create`, `/orders/post-offer`, `/orders/dashboard`, `/orders/[id]` | Order management + detail (reads real chain data). |
| `/trade`, `/trade/confirm`, `/trade/payment`, `/trade/waiting`, `/trade/success` | The real end-to-end trade flow with Crossmint writes + on-chain polling. |
| `/trade/enable-usdc` | USDC trustline / enablement screen (trustline check is currently a stub). |
| `/anchor` | Live SEP-24 anchor capability discovery. |
| `/profile`, `/profile/liquidity-provider` | Profile + LP screens (placeholder reputation/trust data). |

**API routes (`src/app/api/`)**

| Route | Purpose |
|---|---|
| `/api/rates` | Combined rate snapshot (contract → reflector → BCRA → constant). |
| `/api/anchor/info` | SEP-1 TOML + SEP-24 `/info` for the configured anchor. |
| `/api/match-order` | Order matching helper. |

**Key lib files (`src/lib/`)**

| File | Role |
|---|---|
| `contract-config.ts` | **Single source of truth** for the p2p contract id (`resolveP2PContractId()`). |
| `p2p.ts` | Read path — query orders/config/rate from the contract. |
| `p2p-crossmint.ts` | Write path — Crossmint email-signer Stellar smart-wallet contract writes (`takeOrderWithCrossmint`, `submitFiatPaymentWithCrossmint`, `confirmFiatPaymentWithCrossmint`, `createOrderWithCrossmint`). |
| `rates.ts` | Shared rate types + client fetch (`RateSnapshot`, `RateSource`). |
| `rates-server.ts` | Server-side reads: contract `reference_rate`, direct Reflector read, BCRA fetch; builds the combined snapshot with the documented preference order. |
| `useLiveRate.ts` | React hook surfacing the live rate to UI. |
| `sep24.ts` | Anchor discovery (`fetchAnchorInfo`) + scaffolded `Sep24DepositRequest`. |
| `match-order.ts`, `order-mapper.ts` | Order matching + chain↔UI mapping. |
| `store.ts` | Zustand store (localStorage — the only persistence; no backend). |
| `wallet-balance.ts`, `vendor-payment-request.ts`, `utils.ts` | Balances, payment-request building, helpers. |

**Key components (`src/components/`)**

| Component | Role |
|---|---|
| `trade/Transferencias30QR.tsx` | Renders the EMVCo MPM / Transferencias 3.0 QR for the ARS leg. |
| `AnchorCard.tsx` | Surfaces live anchor capabilities. |
| `OrderCard.tsx` | Marketplace order entry → real trade flow. |
| `trade/TradeChatDrawer.tsx`, `BalanceCard.tsx`, `DepositModal.tsx`, etc. | Supporting UI. |

### Contract (`contracts/contracts/p2p/src/`)

| Module | Role |
|---|---|
| `lib.rs`, `contract.rs` | Contract entrypoint + wiring. |
| `core/order.rs` | Order lifecycle (create/take/cancel/fiat-payment/confirm). |
| `core/oracle.rs` | **Reflector SEP-40 cross-contract call** — `set_oracle`, `get_oracle`, `reference_rate`. |
| `core/dispute.rs` | Single-chain dispute resolution via `dispute_resolver`. |
| `core/admin.rs` | Admin / pause / config. |
| `core/validators/` | Input + state validators. |
| `events/handler.rs` | Event emission. |
| `storage/types.rs` | Storage types. |
| `tests/test.rs` | 20/20 passing tests (incl. 2 oracle tests). |

---

## 4. How to build / run / deploy

> **Windows build gotcha:** the team's Windows machine has **no C linker** (no MSVC/gcc), so `cargo`/`stellar` fail natively. Build/test/deploy via **WSL Ubuntu** (rust 1.96 + cc/gcc + stellar CLI). Run scripts from PowerShell using `wsl bash` and `/mnt/c/...` paths — **Git Bash mangles `/mnt` paths**, so use `wsl bash` directly.

### Contract (in WSL)

```bash
# From PowerShell, invoke WSL bash with an /mnt path:
wsl bash -lc 'cd /mnt/c/Users/usuario/"peerly pay"/peerlypay/contracts && make p2p-build'

# Tests — expect 20/20:
wsl bash -lc 'cd /mnt/c/Users/usuario/"peerly pay"/peerlypay/contracts && cargo test -p p2p'

# Deploy + init from YOUR funded admin (replace G.../C... values):
#   make p2p-install   NETWORK=testnet SOURCE=admin
#   make p2p-deploy    NETWORK=testnet SOURCE=admin
#   make p2p-init      NETWORK=testnet SOURCE=admin ADMIN=G... DISPUTE_RESOLVER=G... PAUSER=G... TOKEN_CONTRACT_ID=C...
#   make p2p-config    NETWORK=testnet SOURCE=admin          # set_oracle → Reflector
#   make p2p-seed-orders NETWORK=testnet                     # seed demo orders
```

Useful Make targets (see `contracts/Makefile`): `p2p-build`, `p2p-install`, `p2p-deploy`, `p2p-init`, `p2p-config`, `p2p-seed-orders` / `p2p-seed-orders-small`, `p2p-quickstart`, `p2p-flow`, `p2p-wallet-setup`, `wallets-bootstrap-p2p`, `wallets-trustline-p2p`.

### Frontend

```bash
npm install
# Set NEXT_PUBLIC_P2P_CONTRACT_ID to YOUR redeployed+seeded contract (else it uses the throwaway default).
npm run dev      # local dev (Next.js 16 App Router)
npm run build && npm run start   # production
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · Crossmint email-signer Stellar smart wallets (testnet).

---

## 5. Open items / TODO before submission (2026-06-30)

- [ ] **Redeploy from a real funded admin identity** and run `make p2p-seed-orders`; set `NEXT_PUBLIC_P2P_CONTRACT_ID`. *(The current instance uses a throwaway admin and has no orders → marketplace is empty.)*
- [ ] **Finish interactive SEP-24** signing (SEP-10 wallet-signed challenge → signed deposit). Discovery/info already live.
- [ ] **Record the 1–2 min demo video** (hard requirement).
- [ ] **Run 5 customer-discovery interviews** and document them (intro says 5; rubric min 3). Write up in `CUSTOMER_DISCOVERY.md` (Spanish, Argentine audience).
- [ ] **Consider a mainnet deploy** — mainnet deploy or live traction is a scoring advantage (Reflector mainnet oracle id is already known: `CBKGPWGK…`).
- [ ] **Replace the `checkUSDCTrustline` stub** with a real on-chain trustline check.
- [ ] **Remove remaining placeholders** (bank details, maker names, reputation/trust scores) or clearly label them as demo data.
- [ ] **Write the repo-root `README.md`** with a clear mocks-disclosure section (the template invites this; judges reward honesty).
- [ ] Confirm the **public open-source repo** is clean and the README documents the load-bearing Stellar integration.

---

## 6. Known risks / gotchas

- **No C linker on Windows** → all Rust/Stellar work must go through **WSL**. Don't try to `cargo build` from native Windows.
- **Marketplace is empty until seeded.** The mock auto-advancing simulation was removed in favor of real chain reads, so with the throwaway, un-seeded instance there are **no orders to show**. Seed before demoing.
- **Contract instance admin is a throwaway key.** Do not rely on it for the live pitch; you can't recover it and it isn't yours. Redeploy.
- **Do not overstate Transferencias 3.0.** It is an interoperable EMVCo QR for the ARS leg — present it as the **off-chain fiat trigger**, not as a fully irrevocable / fully interoperable settled rail.
- **Dispute resolution is single-chain.** Resolved on-chain by the contract's `dispute_resolver` (`resolve_dispute`). **Base/Slice cross-chain is aspirational docs-only** — do not claim it as built.
- **No backend.** All app state is `localStorage`/Zustand. Anything that "feels" persistent across devices/users isn't.
- **Rate fallbacks can mask oracle failures.** If the contract/Reflector reads fail silently, the UI degrades to BCRA or the `1485` constant. Check `source` in `/api/rates` (`"contract"` is the good path) when demoing the on-chain oracle.

---

## 7. Decisions log

| Decision | Why |
|---|---|
| **Read the FX rate via Reflector THROUGH our own contract** (not a hardcoded or admin-set rate) | Makes Stellar **load-bearing**: the rate that prices every trade comes from an on-chain SEP-40 oracle via a cross-contract call from our contract. This is the headline "integration depth" feature and removes the trust assumption of an admin-set price. Replaced `MOCK_RATE = 1485`. |
| **Testnet first** | Fast iteration with friendbot funding + the SDF reference anchor and Reflector testnet oracle, all wired and verified live. Mainnet is a follow-up for scoring advantage once the flow is locked. |
| **Non-custodial P2P escrow on Soroban** | Core differentiator vs incumbents (Lemon, Belo, Buenbit, Ripio are mostly custodial). Users keep their keys; the contract escrows USDC and releases to the correct party on fiat proof, with on-chain dispute resolution. |
| **Argentina-native Transferencias 3.0 linkage** | No known existing project bridges T3.0 to Stellar; it ties the off-chain ARS leg directly to escrow release and gives a concrete, local on/off-ramp story. |
| **BCRA official rate alongside the market rate** | Transparency: surfaces the gap between the official and market USD/ARS, which is the whole reason dolarized freelancers need this. |
| **Crossmint email-signer smart wallets** | Lowers onboarding friction (no seed-phrase UX) while keeping real on-chain contract writes. |
| **Keep the old Trustless-Work crate unwired** | The `p2p` contract is the single live escrow; the TW crate stays as reference (`docs/trustless-work/`) to avoid two competing escrow paths. |

---

_Update this file whenever real/mock status, IDs, or the deploy target changes. It is the handoff contract for the team._
