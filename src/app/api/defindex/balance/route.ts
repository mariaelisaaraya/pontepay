import { defindexErrorMessage } from '../error-message';

const VAULT_ADDRESS = 'CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return Response.json({ error: 'address query param is required' }, { status: 400 });
    }

    const apiKey = process.env.DEFINDEX_API_KEY;

    if (!apiKey) {
      return Response.json({ dfTokens: '0', usdcValue: '0', demo: true });
    }

    const { DefindexSDK, SupportedNetworks } = await import('@defindex/sdk');
    const sdk = new DefindexSDK({ apiKey, baseUrl: 'https://api.defindex.io' });

    const balance = await sdk.getVaultBalance(VAULT_ADDRESS, address, SupportedNetworks.TESTNET);

    return Response.json({
      dfTokens: String(balance.dfTokens ?? 0),
      usdcValue: String(balance.underlyingBalance?.[0] ?? 0),
    });
  } catch (e) {
    return Response.json(
      { error: defindexErrorMessage(e, 'DeFindex balance failed') },
      { status: 502 },
    );
  }
}
