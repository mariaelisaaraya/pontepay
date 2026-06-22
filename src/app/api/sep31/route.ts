// Server-side SEP-31 proxy — avoids CORS when calling anchor endpoints from
// the browser. Three actions:
//   GET ?action=info&domain=...            → anchor's SEP-31 /info
//   GET ?action=transaction&domain=...&id= → anchor's /transactions/:id
//   POST { domain, payload }               → anchor's POST /transactions

import { NextRequest, NextResponse } from 'next/server';

const TOML_CACHE = new Map<string, { server: string | null; ts: number }>();
const TOML_TTL = 3600_000; // 1 hour

async function resolveServer(domain: string): Promise<string | null> {
  const cached = TOML_CACHE.get(domain);
  if (cached && Date.now() - cached.ts < TOML_TTL) return cached.server;

  try {
    const res = await fetch(`https://${domain}/.well-known/stellar.toml`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const toml = await res.text();
    const match = toml.match(/^\s*DIRECT_PAYMENT_SERVER\s*=\s*"([^"]+)"/m);
    const server = match ? match[1] : null;
    TOML_CACHE.set(domain, { server, ts: Date.now() });
    return server;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const domain = searchParams.get('domain') ?? 'testanchor.stellar.org';

  const server = await resolveServer(domain);
  if (!server) {
    return NextResponse.json({ error: 'SEP-31 server not found in stellar.toml' }, { status: 502 });
  }

  if (action === 'info') {
    const res = await fetch(`${server}/info`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Anchor /info HTTP ${res.status}` }, { status: 502 });
    }
    return NextResponse.json(await res.json());
  }

  if (action === 'transaction') {
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const res = await fetch(`${server}/transactions/${id}`);
    if (!res.ok) {
      return NextResponse.json({ error: `Anchor /transactions/${id} HTTP ${res.status}` }, { status: 502 });
    }
    return NextResponse.json(await res.json());
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { domain?: string; payload?: unknown };
  const domain = body.domain ?? 'testanchor.stellar.org';

  const server = await resolveServer(domain);
  if (!server) {
    return NextResponse.json({ error: 'SEP-31 server not found in stellar.toml' }, { status: 502 });
  }

  const res = await fetch(`${server}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body.payload),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { error?: string }).error ?? `Anchor POST /transactions HTTP ${res.status}` },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 201 });
}
