import { defindexErrorMessage } from '../error-message';

const VAULT_ADDRESS = 'CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN';

export const revalidate = 300;

export async function GET() {
  try {
    const apiKey = process.env.DEFINDEX_API_KEY;

    if (!apiKey) {
      return Response.json({ apy: 4.2, demo: true });
    }

    const { DefindexSDK, SupportedNetworks } = await import('@defindex/sdk');
    const sdk = new DefindexSDK({ apiKey, baseUrl: 'https://api.defindex.io' });

    // SDK already returns { apy: number } — unwrap so the client always gets a flat number.
    const { apy } = await sdk.getVaultAPY(VAULT_ADDRESS, SupportedNetworks.TESTNET);

    return Response.json({ apy });
  } catch (e) {
    return Response.json(
      { error: defindexErrorMessage(e, 'DeFindex APY failed') },
      { status: 502 },
    );
  }
}
