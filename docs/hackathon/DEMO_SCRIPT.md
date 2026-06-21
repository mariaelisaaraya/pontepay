# PeerlyPay — Demo Video Script (90–120s)

Shot-by-shot script for the required 1–2 minute hackathon demo video (PULSO Argentina, NearX + Stellar Development Foundation). Target runtime: **90–120 seconds**. The single job of this video is to **show the load-bearing Stellar integration end-to-end** — a non-custodial USDC↔ARS trade where the escrow lives in a Soroban contract and the exchange rate is read on-chain from the Reflector oracle through that same contract.

- **Product:** mobile-first, non-custodial P2P marketplace, USDC on Stellar ↔ Argentine peso (ARS).
- **Live contract (testnet):** `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ`
- **Recording surface:** phone-width viewport (the app is mobile-first). Record at a portrait/phone aspect so the UI looks native.
- **Tone:** confident, concrete, builder. No hype, no invented metrics.

> **Why each shot matters (judging map):** the flow below is designed to hit all four PULSO criteria in one take — (1) integration depth via the Reflector oracle cross-contract call, (2) ecosystem impact via Stellar USDC + SEP-24 anchor, (3) customer discovery (named in the close), (4) deployment quality via the live testnet contract + on-chain tx on stellar.expert.

---

## At-a-glance shot list

| # | Time | Screen / Route | One-line beat |
|---|------|----------------|---------------|
| 0 | 0:00–0:08 | Title card | Hook + value prop |
| 1 | 0:08–0:18 | Home `/` → Connect Wallet | Crossmint Stellar testnet wallet |
| 2 | 0:18–0:30 | Marketplace `/marketplace` | Real on-chain orders |
| 3 | 0:30–0:40 | Order detail `/orders/[id]` | Real chain data, open an order |
| 4 | 0:40–0:58 | Confirm `/trade/confirm` | **Live rate with `oracle` tag — the headline** |
| 5 | 0:58–1:12 | Payment `/trade/payment` | Transferencias 3.0 QR (off-chain fiat leg) |
| 6 | 1:12–1:22 | Waiting `/trade/waiting` | 5s on-chain polling, escrow release |
| 7 | 1:22–1:30 | Success `/trade/success` | Trade complete |
| 8 | 1:30–1:42 | `/anchor` + stellar.expert | SEP-24 anchor + the on-chain tx & contract |
| 9 | 1:42–1:50 | Closing card | One-line value prop |

Total: ~110s. If you need to land under 120s hard, trim shot 0 to 5s and shot 8 to 8s.

---

## Shot 0 — Title card (0:00–0:08)

- **On screen:** PeerlyPay logo/banner on a clean background. Subtitle line: "Non-custodial USDC ↔ ARS, on Stellar." Small line under it: "Soroban escrow · Reflector oracle · Transferencias 3.0."
- **Narrator (EN):** "Argentine freelancers earn in crypto and spend in pesos. PeerlyPay is a non-custodial P2P marketplace to swap USDC and ARS — with the escrow and the exchange rate living on Stellar."
- **Click:** none (static card, or a slow zoom).

---

## Shot 1 — Connect the Stellar wallet (0:08–0:18)

- **Route:** `/` (home).
- **On screen:** the app home with the balance card. Top-right shows the magenta **"Connect Wallet"** button (`src/components/WalletButton.tsx`). Tap it; Crossmint email-signer login appears; after auth the button becomes the **"Account"** chip and the dropdown shows the **"Stellar Testnet"** network badge with a USDC balance.
- **Narrator (EN):** "Sign in with a Crossmint email-signer smart wallet — a real Stellar testnet account. The key is non-custodial; PeerlyPay never holds your funds."
- **Click:** tap **Connect Wallet** → complete Crossmint login → tap the **Account** chip once to flash the "Stellar Testnet" badge and balance, then close it.
- **Note for editor:** keep this tight. If the Crossmint email step is slow, cut from "tap Connect" straight to the connected "Account / Stellar Testnet" state.

---

## Shot 2 — Marketplace with real on-chain orders (0:18–0:30)

- **Route:** `/marketplace`.
- **On screen:** the order list (Buy/Sell tabs). These cards are **read from the deployed contract**, not mock JSON — each is an `OrderCard` backed by real chain data (`refreshOrdersFromChain`). Hover/scroll one card showing amount in USDC, the ARS price, and payment method.
- **Narrator (EN):** "This marketplace is live order data, read straight from our Soroban contract on testnet. A maker posts an order to buy or sell USDC for pesos; a taker fills it."
- **Click:** scroll the list once, then tap a **sell-USDC** order (so the demo buyer pays ARS and receives USDC — the cleanest narrative).

> **Pre-record dependency:** the demo testnet instance ships with **no seeded orders**. You must seed first (see checklist) or this screen is empty.

---

## Shot 3 — Open an order (real chain data) (0:30–0:40)

- **Route:** `/orders/[id]`.
- **On screen:** the order detail page — amount, rate, maker handle, payment method, status. This routes into the **real** trade flow (no fake auto-advancing simulation). Tap the primary action to start the trade.
- **Narrator (EN):** "Open it and the details come from chain state — amount, status, the maker. Let's take this order."
- **Click:** tap the primary CTA on the order detail to enter `/trade/confirm`.

---

## Shot 4 — Confirm: the live oracle rate (0:40–0:58) — HEADLINE SHOT

- **Route:** `/trade/confirm` (`src/app/trade/confirm/page.tsx`).
- **On screen:** the "Confirm Sale / Confirm Purchase" summary card: **You send / You receive**, **Network: Stellar**, **Estimated time**, and the **Rate** row reading `1 USD ≈ 1461 ARS` with a small grey **`ORACLE`** badge next to it. **Hold on this badge — push in / highlight it.**
- **Narrator (EN):** "Here's the part that matters. That rate isn't a hardcoded number and it isn't an admin price. Our contract's `reference_rate` makes a cross-contract call to the Reflector SEP-40 oracle on Stellar and returns the live pesos-per-dollar rate. The frontend reads it back **through our contract** — that's what the `oracle` tag means."
- **Click:** let the Rate row sit on screen for a full beat (this is the integration-depth proof), then tap **Confirm Trade**. Tapping triggers `takeOrderWithCrossmint` — a real Crossmint contract write.
- **Editor note:** if you can, overlay one short caption: `reference_rate(2 = ARS) → Reflector → 1461`. Do not invent a different number; on-screen and overlay must match what the live `/api/rates` returns at record time.

---

## Shot 5 — Payment: Transferencias 3.0 QR (0:58–1:12)

- **Route:** `/trade/payment` (`src/app/trade/payment/page.tsx`).
- **On screen:** the "Send Payment" screen — order summary (You receive USDC, Exchange rate, 0.5% fee, **Total to send in ARS**), then the **"Pay with Transferencias 3.0"** card rendering the interoperable QR (component `Transferencias30QR`), with the caption "Scan with any bank or wallet app · BCRA interoperable QR." Below it, the payment instructions (CBU / alias). A 15-minute countdown ring sits in the header.
- **Narrator (EN):** "The fiat leg uses Argentina's own rails. This is a real EMVCo interoperable QR for a BCRA Transferencias 3.0 payment — scannable by any Argentine bank or wallet app. As far as we know, no one else bridges Transferencias 3.0 to Stellar."
- **Click:** point at the QR, then tap **"I've sent the payment."** This fires `submitFiatPaymentWithCrossmint` — a real on-chain write moving the order to `AwaitingConfirmation`.
- **Disclosure (do NOT skip in editing):** the bank/alias details on this card are placeholder data; the QR encoding and the on-chain submit are real.

---

## Shot 6 — Waiting: on-chain polling & escrow release (1:12–1:22)

- **Route:** `/trade/waiting` (`src/app/trade/waiting/page.tsx`).
- **On screen:** the spinner/shield status card with the **"Live updates / Checking…"** pill. The page polls the contract every **5 seconds** (`loadChainOrderByIdFromContract`) for the order status. When the crypto-seller confirms receipt (`confirmFiatPaymentWithCrossmint`), the contract releases USDC from escrow and the status flips to `Completed`, auto-advancing to success.
- **Narrator (EN):** "Now the USDC is escrowed in the Soroban contract. The app polls chain state every five seconds. When the seller confirms the peso transfer arrived, the contract releases the escrow — automatically."
- **Click:** none required if you have both sides staged; the screen advances itself on the next poll. (For a solo recording, have the counterparty/seller confirm so the poll catches `Completed`.)

---

## Shot 7 — Success (1:22–1:30)

- **Route:** `/trade/success` (`src/app/trade/success/page.tsx`).
- **On screen:** green check animation, "You're all set," **You received N USDC**, **You paid ARS**, transaction summary.
- **Narrator (EN):** "Done. USDC delivered, pesos paid, and nobody custodied the funds in between."
- **Click:** none. Hold ~2s.
- **Disclosure:** the Transaction ID shown here is a placeholder label — the *real* proof is the on-chain tx we show next.

---

## Shot 8 — SEP-24 anchor + the on-chain proof (1:30–1:42)

Two quick beats, ~6s each.

**8a — Anchor (`/anchor`, `src/components/AnchorCard.tsx`):**
- **On screen:** "Fiat anchor (SEP-24)" card with the green **"Connected"** badge, the anchor domain (`testanchor.stellar.org`), USDC deposit/withdraw rails, and the **SEP-10 auth / SEP-24 transfer** chips. These capabilities are read live from the anchor's TOML + SEP-24 `/info` via `/api/anchor/info`.
- **Narrator (EN):** "We also discover a real SEP-24 anchor live — the on-ramp/off-ramp path between Stellar USDC and local fiat."

**8b — On-chain tx (`stellar.expert`):**
- **On screen:** a pre-opened **stellar.expert (testnet)** tab showing the take/confirm transaction against contract `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ`. Briefly highlight the contract ID and a `reference_rate`/`take_order` invocation.
- **Narrator (EN):** "And it's all verifiable: here's the deployed contract and a real transaction on stellar.expert. Contract `CC2CA5…76TJ`."
- **Click:** switch to the already-open stellar.expert tab; scroll once to the contract ID / invocation.

---

## Shot 9 — Closing value prop (1:42–1:50)

- **On screen:** PeerlyPay logo, one line of text on screen matching the VO.
- **Narrator (EN) — the one-line value prop:** "PeerlyPay: non-custodial USDC-to-peso trades where the escrow and the live exchange rate both live on Stellar."
- **Click:** none. End card.

---

## Pre-record checklist

Do all of this **before** you hit record. The shipped demo testnet instance uses a throwaway admin key and has **no seeded orders**, so a clean recording requires your own setup.

1. **Redeploy + seed from your own funded admin identity.** The default deployed instance has no seeded orders. Redeploy `contracts/contracts/p2p` from a funded admin, then seed:
   - `make p2p-seed-orders`
   - (Builds/tests/deploys run via **WSL Ubuntu** — the Windows host has no C linker. Invoke scripts as `wsl bash "/mnt/c/.../contracts/<script>.sh"` from PowerShell; Git Bash mangles `/mnt` paths.)
   - Sanity check: `cargo test -p p2p` should be **20/20** in WSL.
2. **Set the env var** so the frontend reads/writes the right instance: `NEXT_PUBLIC_P2P_CONTRACT_ID=<your deployed contract id>` (the unified id is consumed via `src/lib/contract-config.ts`). If you keep the shipped instance, use `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ`.
3. **Fund the demo wallet** with testnet USDC (and a trustline) so balances and fills are real on camera. Confirm the Crossmint email-signer wallet logs in cleanly first.
4. **Verify the live rate** before recording: hit `/api/rates` and confirm `source: "contract"` with a sane `usdArs` (≈1461 at last check) so the **`ORACLE`** tag shows on `/trade/confirm`. Whatever number is live, your VO/overlay must match it — do not narrate a stale figure.
5. **Stage both sides of the trade** (or two browser profiles/wallets) so the `/trade/waiting` poll actually flips to `Completed` on camera. The release requires the crypto-seller to confirm.
6. **Pre-open the stellar.expert testnet tab** to a real transaction on contract `CC2CA5…76TJ` (ideally a `take_order` / `confirm_fiat_payment` / `reference_rate` call) so shot 8b is one tab-switch, not a search.
7. **Confirm `/anchor` shows "Connected"** (anchor reachable) before recording shot 8a.
8. **Record mobile-width.** The app is mobile-first; record portrait/phone aspect.

---

## What to explicitly NOT claim

Keep the narration honest — the rubric rewards documenting mocks, and overclaiming risks the deployment-quality score. Do **not** say or imply any of the following:

- **Do NOT claim interactive SEP-24 deposit/withdraw is live.** Only **discovery** is live (we read the anchor's SEP-1 TOML + SEP-24 `/info`). The SEP-10 wallet-signed challenge / signed deposit is **scaffolded, not completed** — it's the next step. The on-screen `/anchor` card already says so ("Interactive deposit … is the next integration step"); the VO must not contradict it.
- **Do NOT claim cross-chain / Base / Slice dispute resolution.** That path is **docs-only / aspirational**. The real dispute path is **single-chain**, resolved on-chain by the contract's `dispute_resolver` via `resolve_dispute`. The demo doesn't need to show disputes; if you mention them, say "single-chain on-chain resolution."
- **Do NOT present bank details, maker names, reputation/trust scores, or the success "Transaction ID" as real backend data.** There is **no backend**; that state lives in localStorage/Zustand and is placeholder. The real proof is the on-chain tx on stellar.expert.
- **Do NOT imply the trustline is verified on-chain.** `checkUSDCTrustline` is a stub that returns `true`.
- **Do NOT mention the older Trustless-Work escrow crate as the live contract.** The live, wired contract is the **p2p** Soroban contract (`CC2CA5…76TJ`). The Trustless-Work crate exists in the repo but is not wired to the app.
- **Do NOT invent metrics, users, partnerships, or volume.** No "X users," no "processed $Y." Customer discovery (5 interviews) can be referenced as validation, but state it as interviews, not traction.
