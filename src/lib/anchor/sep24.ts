// SEP-24 anchor integration (interactive fiat on/off-ramp).
//
// Read-only discovery (anchor capabilities) is implemented and load-bearing: we
// read the anchor's stellar.toml + SEP-24 /info to surface real deposit/withdraw
// rails. The interactive deposit/withdraw flow additionally needs SEP-10 auth
// (a wallet-signed challenge) — scaffolded in `Sep24DepositRequest` below.
//
// Default anchor: the SDF reference testnet anchor (USDC deposit/withdraw).

const DEFAULT_ANCHOR_DOMAIN =
  process.env.NEXT_PUBLIC_SEP24_ANCHOR_DOMAIN?.trim() || 'testanchor.stellar.org';

export interface AnchorInfo {
  domain: string;
  webAuthEndpoint: string | null; // SEP-10
  transferServer: string | null; // SEP-24
  signingKey: string | null;
  deposit: string[]; // enabled deposit asset codes
  withdraw: string[]; // enabled withdraw asset codes
}

function tomlValue(toml: string, key: string): string | null {
  const match = toml.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]+)"`, 'm'));
  return match ? match[1] : null;
}

/** Reads a Stellar anchor's SEP-1 TOML + SEP-24 /info to discover its rails. */
export async function fetchAnchorInfo(
  domain: string = DEFAULT_ANCHOR_DOMAIN,
): Promise<AnchorInfo> {
  const tomlRes = await fetch(`https://${domain}/.well-known/stellar.toml`, {
    next: { revalidate: 3600 },
  });
  if (!tomlRes.ok) throw new Error(`anchor TOML HTTP ${tomlRes.status}`);
  const toml = await tomlRes.text();

  const webAuthEndpoint = tomlValue(toml, 'WEB_AUTH_ENDPOINT');
  const transferServer =
    tomlValue(toml, 'TRANSFER_SERVER_SEP0024') ?? tomlValue(toml, 'TRANSFER_SERVER');
  const signingKey = tomlValue(toml, 'SIGNING_KEY');

  let deposit: string[] = [];
  let withdraw: string[] = [];

  if (transferServer) {
    try {
      const infoRes = await fetch(`${transferServer}/info`, { next: { revalidate: 3600 } });
      if (infoRes.ok) {
        const info = (await infoRes.json()) as {
          deposit?: Record<string, { enabled?: boolean }>;
          withdraw?: Record<string, { enabled?: boolean }>;
        };
        deposit = Object.entries(info.deposit ?? {})
          .filter(([, v]) => v?.enabled)
          .map(([code]) => code);
        withdraw = Object.entries(info.withdraw ?? {})
          .filter(([, v]) => v?.enabled)
          .map(([code]) => code);
      }
    } catch (error) {
      console.warn('[sep24] /info read failed', error);
    }
  }

  return { domain, webAuthEndpoint, transferServer, signingKey, deposit, withdraw };
}

// SEP-10: fetch challenge XDR from anchor (via Next.js proxy to avoid CORS).
export async function sep10GetChallenge(account: string): Promise<string> {
  const res = await fetch(`/api/anchor/sep10?account=${encodeURIComponent(account)}`);
  const data = (await res.json()) as { transaction?: string; error?: string };
  if (!res.ok || !data.transaction)
    throw new Error(data.error ?? `SEP-10 challenge HTTP ${res.status}`);
  return data.transaction;
}

// SEP-10: submit signed challenge XDR, receive JWT.
export async function sep10SubmitChallenge(signedXdr: string): Promise<string> {
  const res = await fetch('/api/anchor/sep10', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedXdr }),
  });
  const data = (await res.json()) as { token?: string; error?: string };
  if (!res.ok || !data.token)
    throw new Error(data.error ?? `SEP-10 submit HTTP ${res.status}`);
  return data.token;
}

// SEP-24: open interactive deposit. Returns the anchor's popup URL.
export async function sep24StartDeposit(params: {
  jwt: string;
  assetCode: string;
  account: string;
  amount?: string;
}): Promise<string> {
  const res = await fetch('/api/anchor/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url)
    throw new Error(data.error ?? `SEP-24 deposit HTTP ${res.status}`);
  return data.url;
}

// SEP-24: open interactive withdrawal. Returns the anchor's popup URL.
export async function sep24StartWithdraw(params: {
  jwt: string;
  assetCode: string;
  account: string;
  amount?: string;
}): Promise<string> {
  const res = await fetch('/api/anchor/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url)
    throw new Error(data.error ?? `SEP-24 withdraw HTTP ${res.status}`);
  return data.url;
}
