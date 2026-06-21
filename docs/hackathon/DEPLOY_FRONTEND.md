# Deploy the PeerlyPay frontend (live URL)

How to put the PeerlyPay web app on a public URL for the PULSO submission/demo.

## TL;DR — use Vercel, not GitHub Pages

PeerlyPay is **not a static site**. It uses Next.js **server route handlers** that run
on the server:

- `GET /api/rates` reads the live ARS/USD rate **through our Soroban contract**
  (`reference_rate`) and fetches the **BCRA** official rate server-side (browsers
  can't call BCRA directly — CORS).
- `GET /api/anchor/info` reads the SEP-24 anchor's TOML + `/info` server-side.

**GitHub Pages only serves static files** → it would break both endpoints (and SSR).
You'd have to `output: 'export'` and move all server logic to the client, losing the
CORS-safe BCRA call and the server-mediated rate. **Don't.** Use **Vercel** — it's
built for Next.js (App Router, server components, route handlers, edge/Node runtimes)
and is free for this scale.

> The Rust **contract** is deployed separately on Stellar (see
> [`MAINNET_DEPLOY.md`](./MAINNET_DEPLOY.md)). Vercel only builds and hosts the
> **frontend** (`next build`); it does **not** build the `contracts/` workspace, so no
> Rust toolchain / WSL is involved in the web deploy.

---

## Prerequisites

1. **GitHub repo** with the code pushed (public, for the open-source requirement).
2. A **Crossmint client API key** (from the Crossmint console — the same project used
   for the Stellar smart wallets). This is **required at build time** (see Gotcha #1).
3. Your **deployed + seeded** p2p contract id (see `MAINNET_DEPLOY.md`). Until you
   redeploy from your own admin and seed orders, the marketplace will be empty.

---

## Option A — Vercel Dashboard (recommended, ~5 min)

1. Go to **https://vercel.com** → **Add New… → Project** → **Import** your GitHub repo.
2. **Framework Preset:** Next.js (auto-detected). **Root Directory:** repo root (leave
   default — `package.json` and `next.config.ts` are at the root). Build command
   `next build` and output are auto-detected; don't override.
3. **Environment Variables** — add all of the table below (Production + Preview).
4. **Deploy.** First build takes ~1–2 min. You'll get `https://<project>.vercel.app`.
5. **Add that domain to Crossmint's allowed origins** (Gotcha #2), then redeploy if
   needed.

## Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link            # link the repo to a Vercel project
# add each env var (repeat for production + preview):
vercel env add NEXT_PUBLIC_CROSSMINT_API_KEY production
vercel env add NEXT_PUBLIC_P2P_CONTRACT_ID production
vercel env add NEXT_PUBLIC_SOROBAN_RPC_URL production
vercel env add NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE production
vercel env add NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID production
vercel --prod          # build + deploy
```

---

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**. All are
`NEXT_PUBLIC_*` (exposed to the browser) — there are **no server-only secrets** in
this app. Values below are the **testnet** defaults.

| Variable | Required? | Value (testnet) | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_CROSSMINT_API_KEY` | **Yes (build + runtime)** | `ck_…` from Crossmint console | Wallet auth. App **fails to build/render without it** (see Gotcha #1). |
| `NEXT_PUBLIC_P2P_CONTRACT_ID` | **Yes** | `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ` | Use **your** redeployed + seeded contract id. |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Yes | `https://soroban-testnet.stellar.org` | Soroban RPC. |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Yes | `Test SDF Network ; September 2015` | Must match the contract's network. |
| `NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID` | Yes | `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W` | Fallback direct-Reflector read (the contract reads it on-chain too). |
| `NEXT_PUBLIC_SEP24_ANCHOR_DOMAIN` | No | `testanchor.stellar.org` | Defaults if unset. |

**For a mainnet deploy**, swap: `NEXT_PUBLIC_P2P_CONTRACT_ID` (mainnet contract),
`NEXT_PUBLIC_SOROBAN_RPC_URL` (a mainnet Soroban RPC),
`NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015`,
`NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID=CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC`,
and a Crossmint **production** key. (`.env.example` documents the same keys.)

---

## Gotchas (read these — they will bite you)

**1. The Crossmint key is required at BUILD time.**
`src/app/providers.tsx` does `const apiKey = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY!`
and mounts `CrossmintProvider`. During `next build`, Next prerenders pages, which
renders the provider and **decodes the key**. With a missing key you get a
`startsWith` crash; with a malformed key, `Non-base58 character`. A **valid** key makes
the build pass. Vercel injects env vars before the build, so just set it first. The
frontend compiles + type-checks cleanly (verified); the only build dependency is this
key.

**2. Whitelist the Vercel domain in Crossmint.**
Crossmint validates the **origin**. Add `https://<project>.vercel.app` (and any custom
domain / preview domains you use) to your Crossmint project's allowed origins, or wallet
login + signing will silently fail on the live site. Localhost works out of the box;
production domains do not until added.

**3. Marketplace is empty until you seed.**
The mock orders were removed (orders now come only from chain). Redeploy the contract
from your own admin and run `make p2p-seed-orders` (see `MAINNET_DEPLOY.md`), then point
`NEXT_PUBLIC_P2P_CONTRACT_ID` at it.

**4. Route handlers run on Node (default), which is what we need.**
`/api/rates` uses `@stellar/stellar-sdk`; keep it on the Node runtime (the default for
route handlers — do not set `runtime = 'edge'` on these routes).

---

## Post-deploy smoke test

Open the live URL and verify:

- [ ] `https://<domain>/api/rates` → JSON with `"source":"contract"` and `contract` ≈ the
      live ARS rate (~1461). This proves the on-chain oracle path works in production.
- [ ] `https://<domain>/api/anchor/info` → the SDF anchor capabilities (USDC deposit/
      withdraw, SEP-10/SEP-24).
- [ ] Home page loads (no 500 → Crossmint key is set correctly).
- [ ] Wallet login works (→ Crossmint origin is whitelisted).
- [ ] `/marketplace` shows seeded orders; opening one → `/trade/confirm` shows the live
      rate with the **oracle** tag.
- [ ] `/anchor` shows the connected SEP-24 anchor.
- [ ] Complete one full trade end-to-end with a funded testnet wallet.

---

## Custom domain (optional)

Vercel → Project → **Domains** → add e.g. `app.peerlypay.xyz`, follow the DNS
instructions. **Re-add the custom domain to Crossmint's allowed origins** (Gotcha #2).

---

## Why not the alternatives

- **GitHub Pages / any static host** — no server routes; breaks `/api/rates` (BCRA CORS
  + server-mediated contract read) and `/api/anchor/info`. Static export is a downgrade.
- **Netlify / Cloudflare Pages** — workable with their Next.js adapters, but Vercel is
  the first-party Next.js host with zero config here. Use Vercel unless you have a
  reason not to.
