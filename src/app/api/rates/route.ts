import { getRateSnapshot } from '@/lib/rates-server';

// Combined live USD/ARS rate: Reflector on-chain oracle + BCRA official rate.
// Cached briefly so the trade screens can poll cheaply.
export const revalidate = 60;

export async function GET() {
  const snapshot = await getRateSnapshot();
  return Response.json(snapshot, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
  });
}
