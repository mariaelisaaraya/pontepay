import { defindexErrorMessage } from '../error-message';

const VAULT_ADDRESS =
  process.env.DEFINDEX_VAULT_ADDRESS ??
  'CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN';

export async function POST(req: Request) {
  try {
    const { amount, userAddress } = (await req.json()) as {
      amount: number;
      userAddress: string;
    };

    if (!amount || !userAddress) {
      return Response.json({ error: 'amount and userAddress are required' }, { status: 400 });
    }

    const apiKey = process.env.DEFINDEX_API_KEY;

    if (!apiKey) {
      return Response.json(
        { demo: true, error: 'DeFindex is in demo mode: set DEFINDEX_API_KEY to enable deposits' },
        { status: 503 },
      );
    }

    const { DefindexSDK, SupportedNetworks } = await import('@defindex/sdk');
    const sdk = new DefindexSDK({ apiKey, baseUrl: 'https://api.defindex.io' });

    const depositResponse = await sdk.depositToVault(
      VAULT_ADDRESS,
      { amounts: [amount], caller: userAddress, invest: true, slippageBps: 100 },
      SupportedNetworks.TESTNET,
    );

    return Response.json({ xdr: depositResponse.xdr });
  } catch (e) {
    return Response.json(
      { error: defindexErrorMessage(e, 'DeFindex deposit failed') },
      { status: 502 },
    );
  }
}
