const VAULT_ADDRESS = 'CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN';

const MOCK_XDR =
  'AAAAAgAAAABmb2tfeGRyX3BsYWNlaG9sZGVyX2RlZmluZGV4X3dpdGhkcmF3AAAAAAAAAAAAAAAAAAAAAAAA';

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
      return Response.json({ xdr: MOCK_XDR, demo: true });
    }

    const { DefindexSDK, SupportedNetworks } = await import('@defindex/sdk');
    const sdk = new DefindexSDK({ apiKey, baseUrl: 'https://api.defindex.io' });

    const withdrawResponse = await sdk.withdrawFromVault(
      VAULT_ADDRESS,
      { amounts: [amount], caller: userAddress, slippageBps: 100 },
      SupportedNetworks.TESTNET,
    );

    return Response.json({ xdr: withdrawResponse.xdr });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'DeFindex withdraw failed' },
      { status: 502 },
    );
  }
}
