# PeerlyPay → Trustless Work escrow + Privy wallet — integration

Status: **in progress.** This replaces the hand-rolled `p2p` Soroban contract (deprecated for the trade flow) with **Trustless Work** Escrow-as-a-Service, and swaps the wallet from **Crossmint** to **Privy** (email login that can sign Stellar XDRs).

## Why this architecture

| Decision | Reason |
|---|---|
| **Escrow = Trustless Work** (hosted REST API) | The official, audited Stellar escrow protocol. One contract instance per order, real USDC, TTL handled, proper roles + dispute flow. Matches the repo's own `docs/peerlypay/architecture.md`. Removes the p2p audit findings (H-1 etc.) — custody is no longer our buggy code. |
| **Hosted REST API, not self-hosted contract** | The vendored `contracts/contracts/escrow` is an old copy. The official path is `dev.api.trustlesswork.com` → returns an unsigned XDR → sign → `helper/send-transaction`. Far less code, robust, USDC-native. |
| **Wallet = Privy, not Crossmint** | TW needs **raw XDR signing**. Crossmint's Stellar email wallet only does high-level `sendTransaction({contractId, method, args})` and explicitly does **not** support Stellar message/XDR signing. **Privy** supports Stellar embedded wallets with `raw_sign` (Ed25519) → keeps email login AND signs TW's XDR. |

## Role mapping (P2P trade → single-release escrow)

The escrow custodies the **USDC**. The crypto seller funds it; the fiat payer receives it. One milestone = "fiat paid & received". See `src/lib/trustless/roles.ts`.

| Escrow role | P2P actor | Action |
|---|---|---|
| funder (signs `fund_escrow`) | crypto seller | locks USDC at create/take |
| `serviceProvider` | fiat payer | `change_milestone_status` ("fiat sent") |
| `approver` | crypto seller | `approve_milestone` ("fiat received") |
| `releaseSigner` | crypto seller | `release_funds` → USDC to receiver |
| `receiver` | fiat payer | gets the USDC |
| `platformAddress` | PeerlyPay platform | owner, platform fee |
| `disputeResolver` | PeerlyPay platform | `resolve_dispute` (cannot open one) |

`from_crypto=true` → maker is the crypto seller (escrow funded at create). `from_crypto=false` → taker is the crypto seller (escrow deployed+funded at take, when both parties are known). Either party can `dispute_escrow`.

## Lifecycle (per order)

```
deploy (POST /deployer/single-release, signer=funder)
  → fund_escrow (signer=crypto seller, amount as STRING)
  → change_milestone_status (serviceProvider=fiat payer)
  → approve_milestone (approver=crypto seller)
  → release_funds (releaseSigner=crypto seller)   ── happy path
  └ dispute_escrow (either party) → resolve_dispute (platform, distributions sum to balance)
```
Every write op: `POST /api/tw/<path>` → `{ unsignedTransaction }` → sign with Privy `raw_sign` → `POST /api/tw/helper/send-transaction` → verify with `validateOnChain=true`.

## Built so far (credential-independent)

- `src/lib/trustless/types.ts` — single-release payloads/responses, `TRUSTLINES` (USDC testnet `GBBD47IF…`), stroop helpers, the documented gotchas (fund amount = string, milestoneIndex = string, deploy milestones = description only).
- `src/lib/trustless/roles.ts` — P2P trade → escrow role mapping (`escrowRolesForTrade`, `partiesFromOrder`, `funderForTrade`).
- `src/app/api/tw/[...path]/route.ts` — server proxy to TW that injects `x-api-key` (allowlisted to `deployer/`, `escrow/`, `helper/`). Keeps the key off the client.
- `src/lib/escrow-registry.ts` — localStorage registry of escrow contract ids (there is no on-chain "list all"; one order = one contract).

## Pending (needs the 2 credentials below)

1. Privy provider swap: replace `@crossmint/client-sdk-react-ui` with `@privy-io/react-auth` (email login + Stellar embedded wallet); a `signEscrowXdr()` helper using Privy `raw_sign` + `@stellar/stellar-sdk`.
2. `src/lib/trustless/client.ts` — thin client calling the proxy for each op + signing + submit.
3. Trustline + funding bootstrap: ensure each Privy account has a USDC trustline (`/helper/set-trustline`) + XLM for reserves/fees (friendbot on testnet).
4. Rewire `store.ts` + trade flow + order forms to the escrow lifecycle; `escrow-mapper` (Escrow ↔ UiOrder); list via the registry + indexer. Keep `?demo=1` working.
5. Test the full lifecycle on testnet, redeploy to Vercel.

## Credentials needed (only the owner can generate these)

Add to Vercel env (and local `.env`, gitignored):

```
# Trustless Work (server-only — never NEXT_PUBLIC)
TRUSTLESS_WORK_API_KEY=<testnet key>
TRUSTLESS_WORK_BASE_URL=https://dev.api.trustlesswork.com   # optional, default

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=<app id>
PRIVY_APP_SECRET=<app secret>        # server-side ops only

# PeerlyPay platform (escrow owner + dispute resolver)
NEXT_PUBLIC_PLATFORM_ADDRESS=<platform G-address>
PLATFORM_SECRET=<platform secret>    # server-only; signs resolve_dispute
```

**Get the TW testnet API key:** dapp.trustlesswork.com → connect wallet → click address (bottom-left) → Settings → API Keys → complete profile (name/email/use case) → choose **Testnet** → generate → copy immediately (shown once).

**Get the Privy App ID:** dashboard.privy.io → create app → copy App ID + App Secret → enable **Stellar** + add allowed domains (`localhost:3000`, `peerlypay-two.vercel.app`).

## Reference

Skills installed: `trustless-work-dev` (`.agents/skills/trustless-work-dev/`) and `privy` (`.agents/skills/privy/`). TW API: `https://dev.api.trustlesswork.com/docs`. USDC testnet issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.
