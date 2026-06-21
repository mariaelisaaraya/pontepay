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

// Interactive SEP-24 deposit — scaffold. Full production flow:
//   1. SEP-10: GET {webAuthEndpoint}?account=<G...> -> sign the returned
//      challenge transaction with the wallet -> POST it back -> receive a JWT.
//   2. SEP-24: POST {transferServer}/transactions/deposit/interactive with the
//      JWT + asset_code -> receive an interactive `url` -> open it in a popup.
// The remaining piece for production is signing the SEP-10 challenge with the
// Crossmint smart wallet.
export interface Sep24DepositRequest {
  assetCode: string;
  account: string;
  jwt: string;
}
