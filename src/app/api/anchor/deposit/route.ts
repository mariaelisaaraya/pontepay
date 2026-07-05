import { fetchAnchorInfo } from '@/lib/anchor/sep24';

export async function POST(req: Request) {
  try {
    const { jwt, assetCode, account, amount } = (await req.json()) as {
      jwt: string;
      assetCode: string;
      account: string;
      amount?: string;
    };

    const info = await fetchAnchorInfo();
    if (!info.transferServer)
      return Response.json({ error: 'Anchor has no transfer server' }, { status: 502 });

    const body: Record<string, string> = { asset_code: assetCode, account };
    if (amount) body.amount = amount;

    const res = await fetch(`${info.transferServer}/transactions/deposit/interactive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'SEP-24 deposit failed' },
      { status: 502 },
    );
  }
}
