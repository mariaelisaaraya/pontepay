import { fetchAnchorInfo } from '@/lib/sep24';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const account = searchParams.get('account');
  if (!account) return Response.json({ error: 'account required' }, { status: 400 });

  try {
    const info = await fetchAnchorInfo();
    if (!info.webAuthEndpoint)
      return Response.json({ error: 'Anchor has no SEP-10 endpoint' }, { status: 502 });

    const url = new URL(info.webAuthEndpoint);
    url.searchParams.set('account', account);
    url.searchParams.set('home_domain', info.domain);

    const res = await fetch(url.toString());
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'SEP-10 challenge failed' },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { signedXdr } = (await req.json()) as { signedXdr: string };
    const info = await fetchAnchorInfo();
    if (!info.webAuthEndpoint)
      return Response.json({ error: 'Anchor has no SEP-10 endpoint' }, { status: 502 });

    const res = await fetch(info.webAuthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: signedXdr }),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'SEP-10 submit failed' },
      { status: 502 },
    );
  }
}
