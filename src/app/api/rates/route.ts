import { getRateSnapshot } from '@/lib/rates-server';

// Combined live USD/ARS rate: Reflector on-chain oracle + BCRA official rate.
// Cached briefly so the trade screens can poll cheaply.
export const revalidate = 60;

export async function GET() {
  try {
    const snapshot = await getRateSnapshot();
    return Response.json(snapshot, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    });
  } catch {
    return Response.json(
      { error: 'rate_unavailable', source: 'error', midRate: null },
      { status: 503 },
    );
  }
}
