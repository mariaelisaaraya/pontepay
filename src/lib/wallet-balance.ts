// Fetch USDC balance for a Stellar G-address via Horizon API.
// Works with any wallet (Privy, external) — only needs the address string.

const USDC_TESTNET_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

type HorizonBalance = {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
};

type HorizonAccount = {
  balances?: HorizonBalance[];
};

export async function fetchWalletUsdcBalance(address: string | null | undefined): Promise<number> {
  if (!address) return 0;
  try {
    const res = await fetch(`${HORIZON_TESTNET}/accounts/${address}`);
    if (!res.ok) return 0;
    const account = (await res.json()) as HorizonAccount;
    const usdc = account.balances?.find(
      (b) =>
        b.asset_type === 'credit_alphanum4' &&
        b.asset_code === 'USDC' &&
        b.asset_issuer === USDC_TESTNET_ISSUER,
    );
    return usdc ? parseFloat(usdc.balance) : 0;
  } catch {
    return 0;
  }
}
