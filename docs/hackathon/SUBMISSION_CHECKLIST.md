# PeerlyPay — PULSO Argentina Submission Checklist

> **SUBMISSION DEADLINE: June 30, 2026 (23:59).** Finalists announced Jul 1, in-person pitch in Buenos Aires Jul 6, winners Jul 8. This file is the single source of truth for what we hand in and where every artifact lives. Check a box only when the artifact is real and linkable.

**Hackathon:** PULSO Argentina — NearX + Stellar Development Foundation. 10-day online build (Brazil / Argentina / Colombia), Jun 21–30. Teams 2–4.
**Team:** Alexis, Steven, Stefano, Barb.
**Prize:** sponsored trip to Stellar Summit São Paulo.

---

## How to use this file
1. Fill in **Section D** (links) as artifacts go live.
2. Walk **Section A** (hard requirements) — every box must be checked to be eligible.
3. Walk **Section B** (judging criteria) to make sure each scored dimension has concrete evidence pointed at it.
4. Clear **Section C** (pre-submission tasks) before the deadline — this is where the demo goes from "deployed throwaway" to "judge can complete a trade."

---

## A. Hard requirements (eligibility — all must be green)

| # | Requirement | Status | Evidence / artifact to provide |
|---|-------------|--------|--------------------------------|
| A1 | **Public open-source repo + clear README** | - [x] Done | Repo: `PeerlyPay/peerlypay` (GitHub). Root `README.md` describes the product, the live-rate flow, the deployed contract, and an explicit "What is still mock / scaffold" section (the rubric rewards honest disclosure). |
| A2 | **Load-bearing Stellar integration** (must power the product, not decorate a slide) | - [x] Done | Two load-bearing integrations: (1) **On-chain Reflector SEP-40 oracle** — our Soroban `p2p` contract's `reference_rate(2 = ARS)` does a **cross-contract call** to Reflector and returns the live ARS-per-USD rate (~1461), replacing the old hardcoded `MOCK_RATE = 1485`. The frontend reads the rate **through our contract** via `GET /api/rates` (`source: "contract"`). (2) **Non-custodial Soroban escrow** — USDC is escrowed and released by the `p2p` contract across the real trade flow. Without Stellar, the product does not exist. |
| A3 | **Pitch deck** | - [ ] To finalize | `docs/hackathon/PITCH.md` (Spanish, Argentine audience). Export/link a slide deck before submission. |
| A4 | **1–2 min demo video** | - [ ] To record | Script: `docs/hackathon/DEMO_SCRIPT.md`. Record after the team redeploy + seed (see C1–C2) so the demo shows real on-chain state. |
| A5 | **≥5 customer discovery interviews** (intro says 5 → do 5) | - [ ] To paste evidence | `docs/hackathon/CUSTOMER_DISCOVERY.md` (Spanish). Needs 5 interviews with names/roles (or initials), date, key quote, and what changed in the product because of it. |
| A6 | **Live testnet deployment** | - [x] Done (throwaway) → re-do with team admin | `p2p` Soroban escrow deployed on **testnet**: `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ`. **Note:** current instance uses a throwaway admin and has no seeded orders — redeploy from the team's funded admin + seed before the demo (C1–C2). |
| A7 | **≥1 building block from the recommended Integration List** | - [x] Done | **Reflector SEP-40 oracle** (core Stellar building block) is wired and live. **SEP-24 anchor** discovery is live against `testanchor.stellar.org` via `/anchor` + `/api/anchor/info`. Trustless Work Escrow crate also exists in-repo (not wired to the app — disclosed honestly). |

**SCF rubric proxy (authoritative):** "Stellar must be used to meaningfully improve core features, not as a superficial integration." → Met: the live exchange rate the whole marketplace prices against is produced by an on-chain oracle call inside our own contract, and settlement is on-chain escrow. Remaining mocks are documented in the README per the template's invitation.

---

## B. The 4 judging criteria → what we show

### B1. Integration depth & technical complexity
- [x] **On-chain oracle with a cross-contract call.** `p2p` contract calls Reflector (SEP-40) via `set_oracle` / `get_oracle` / `reference_rate`. Testnet oracle `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W`; mainnet oracle `CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC`. This is the headline depth feature — the rate is read from chain, not set by an admin.
- [x] **Full non-custodial escrow lifecycle on Soroban** (`soroban-sdk 23.1.1`): `initialize`, `pause`/`unpause`, `create_order(_cli)`, `cancel_order`, `take_order(_with_amount)`, `submit_fiat_payment`, `execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`, `resolve_dispute`, `get_order(_count)`, `get_config`, `set_oracle`, `get_oracle`, `reference_rate`.
- [x] **20/20 Rust tests pass** (`cargo test -p p2p`), including 2 new oracle tests.
- [x] **Real contract writes from the frontend** via Crossmint email-signer smart wallets: `createOrderWithCrossmint`, `takeOrderWithCrossmint`, `submitFiatPaymentWithCrossmint`, `confirmFiatPaymentWithCrossmint`, with 5s on-chain polling.
- [x] **Layered live-rate fallback chain** (`/api/rates`): our contract `reference_rate` → direct Reflector read → BCRA official API → constant. Verified live: contract = 1461, reflector = 1461.92, bcraOfficial = 1461.
- [x] **Argentina-native rails:** `/api/rates` pulls Argentina's central bank (BCRA) official USD/ARS for transparency; the payment screen renders an EMVCo MPM interoperable QR (CRC16/CCITT) for a **BCRA Transferencias 3.0** payment request — the off-chain fiat leg that triggers escrow release.
- [x] **Real deployment bug fixed:** contract ID unified across read/write paths in `src/lib/contract-config.ts`.

### B2. Impact on the Stellar ecosystem
- [x] **Originality:** no known existing project bridges **Transferencias 3.0** (Argentina's instant-payment standard) to Stellar. PeerlyPay links the T3.0 fiat leg to on-chain USDC escrow.
- [x] **Ecosystem-native primitives, not a wrapper:** Reflector oracle + SEP-24 anchor discovery + Soroban escrow. We consume and showcase core Stellar building blocks.
- [x] **Market framing (cited):** stablecoins were **over half of all ARS exchange purchases** Jul 2024–Jun 2025 (Chainalysis 2025 LATAM report); Argentina is **#2 in LATAM by volume**; structural drivers = persistent inflation, currency volatility, capital controls. Framed as **structural demand**, not hypergrowth (Milei-era disinflation slowed growth rates).
- [x] **Differentiation vs incumbents:** Lemon, Belo, Buenbit, Ripio are mostly **custodial**; PeerlyPay is **non-custodial P2P escrow**. Precedent that ARS-on-Stellar is real: **Anclap** (live Stellar anchor issuing an ARS token) — PeerlyPay differs by being non-custodial P2P + T3.0.

### B3. Customer discovery & validation
- [ ] **5 interviews documented** in `docs/hackathon/CUSTOMER_DISCOVERY.md`: remote workers / freelancers / digital nomads in Argentina who earn in crypto and spend in ARS.
- [ ] Each interview shows: who, when, pain quote, and the **product decision it drove** (judges reward "what changed because of the interview," not just count).
- [ ] Tie at least one product choice (e.g., non-custodial escrow, T3.0 QR, showing the BCRA-vs-market gap) back to a specific interview finding.

### B4. Quality of testnet/mainnet deployment
- [x] **Live testnet** contract deployed and verifiable on a Stellar explorer (testnet).
- [ ] **Redeploy from team admin + seed orders** so a judge sees real, populated marketplace state (C1–C2).
- [ ] **Fresh wallet completes a trade end-to-end** on the deployed instance (C5).
- [ ] **Consider a mainnet deploy** — the rubric explicitly states mainnet deploy or live traction is a **scoring advantage** (C6). Reflector mainnet oracle is already identified: `CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC`.

---

## C. Pre-submission tasks (do before Jun 30)

> Build/test/deploy run under **WSL Ubuntu** (rust 1.96 + cc/gcc + stellar CLI); the team's native Windows shell has no C linker. Invoke from PowerShell as `wsl bash "/mnt/c/.../contracts/<script>.sh"` (Git Bash mangles `/mnt` paths). `cargo test -p p2p` = 20/20.

- [ ] **C1 — Redeploy `p2p` from the team's own funded admin identity.** The current testnet instance uses a throwaway admin key. Use the Makefile targets: `make p2p-build` → `make p2p-install` → `make p2p-deploy` → `make p2p-init` → `make p2p-config` (NETWORK=testnet, SOURCE=admin, with real ADMIN / DISPUTE_RESOLVER / PAUSER / TOKEN_CONTRACT_ID).
- [ ] **C2 — Seed orders** so the marketplace isn't empty: `make p2p-seed-orders` (or `make p2p-seed-orders-small`).
- [ ] **C3 — Update `NEXT_PUBLIC_P2P_CONTRACT_ID`** to the newly deployed contract ID. Re-confirm `set_oracle` is configured to the Reflector oracle on the new instance and that `GET /api/rates` returns `source: "contract"`.
- [ ] **C4 — Finalize the deck** (`docs/hackathon/PITCH.md`) and export to a shareable URL.
- [ ] **C5 — Verify a fresh Crossmint wallet can complete a full trade**: `/trade/confirm → /trade/payment → /trade/waiting → /trade/success`, with the on-chain order advancing via real contract writes (not the old fake auto-advance).
- [ ] **C6 — Record the 1–2 min demo video** from `docs/hackathon/DEMO_SCRIPT.md`, after C1–C5 so it shows real on-chain state and the live oracle rate.
- [ ] **C7 — Paste the 5 interview write-ups** into `docs/hackathon/CUSTOMER_DISCOVERY.md`.
- [ ] **C8 — (Scoring advantage) Consider a mainnet deploy** of `p2p` wired to the Reflector mainnet oracle. If done, capture the mainnet explorer link in Section D.
- [ ] **C9 — Final README pass:** confirm the "What is still mock / scaffold" section is accurate (see honest-disclosure list below) and all links resolve.

### Honest disclosure (keep current in README, do not hide)
- Interactive **SEP-24 deposit/withdraw** (SEP-10 wallet-signed challenge) is **scaffolded** — discovery/`/info` is live; the signed deposit is the next step.
- **Cross-chain Base/Slice dispute resolution** is **docs-only / aspirational**; the real dispute path is single-chain via the contract's `dispute_resolver` → `resolve_dispute`.
- `checkUSDCTrustline` is a **stub** that returns `true`.
- Bank details, maker names, and reputation/trust scores in some screens are **placeholder** — there is **no backend** (state lives in localStorage / Zustand).
- An older **Trustless Work escrow crate** exists in the repo but is **not wired** to the app; the `p2p` contract is the live one.

---

## D. Submission links — fill in before the deadline

| Artifact | URL |
|----------|-----|
| **DoraHacks project page** | `__________________________` |
| **Public repo** | `https://github.com/PeerlyPay/peerlypay` |
| **Demo video (1–2 min)** | `__________________________` |
| **Pitch deck** | `__________________________` (source: `docs/hackathon/PITCH.md`) |
| **Testnet contract — explorer** | `__________________________` (contract `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ`, or the new team-admin contract from C1) |
| **Mainnet contract — explorer** (if C8 done) | `__________________________` |
| **Live app URL** (if deployed) | `__________________________` |

---

## Final go / no-go (run this the morning of Jun 30)
- [ ] All of Section A is checked.
- [ ] `cargo test -p p2p` → 20/20.
- [ ] `GET /api/rates` returns `source: "contract"` with a live ~1461 rate.
- [ ] A fresh wallet completed a trade on the submitted contract instance.
- [ ] Every URL in Section D resolves.
- [ ] README's mock-disclosure section is accurate.
- [ ] DoraHacks project submitted **before 23:59 Jun 30**.
