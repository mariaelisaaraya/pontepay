import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to the Trustless Work REST API.
//
// Keeps the `x-api-key` SECRET (never shipped to the browser). The client calls
// `/api/tw/<tw-path>` exactly as it would call the TW API; we inject the key and
// forward. The flow per write op is: client POSTs payload here → we return the
// `{ unsignedTransaction }` → client signs with its wallet (Privy raw_sign) →
// client POSTs the signed XDR to `/api/tw/helper/send-transaction`.
//
// Env (server-only): TRUSTLESS_WORK_API_KEY, TRUSTLESS_WORK_BASE_URL (optional).

const TW_BASE = (process.env.TRUSTLESS_WORK_BASE_URL || 'https://dev.api.trustlesswork.com').replace(/\/$/, '');
const TW_KEY = process.env.TRUSTLESS_WORK_API_KEY || '';

// Only proxy the known TW surfaces — never an open relay.
const ALLOWED_PREFIXES = ['deployer/', 'escrow/', 'helper/'];

function isAllowed(path: string): boolean {
  return ALLOWED_PREFIXES.some((p) => path === p.replace(/\/$/, '') || path.startsWith(p));
}

async function forward(req: NextRequest, segments: string[], method: 'GET' | 'POST' | 'PUT') {
  const path = segments.join('/');

  if (!isAllowed(path)) {
    return NextResponse.json({ status: 'FAILED', message: `Path not allowed: ${path}` }, { status: 403 });
  }
  if (!TW_KEY) {
    return NextResponse.json(
      { status: 'FAILED', message: 'TRUSTLESS_WORK_API_KEY is not configured on the server.' },
      { status: 503 },
    );
  }

  const url = new URL(`${TW_BASE}/${path}`);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-api-key': TW_KEY },
  };
  if (method !== 'GET') {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return new NextResponse(text || '{}', {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'FAILED', message: `Upstream error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path, 'GET');
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path, 'POST');
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path, 'PUT');
}
