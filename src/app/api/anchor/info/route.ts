import { fetchAnchorInfo } from '@/lib/sep24';

// Discovers the configured Stellar anchor's SEP-24 capabilities (server-side to
// avoid browser CORS against the anchor).
export const revalidate = 3600;

export async function GET() {
  try {
    const info = await fetchAnchorInfo();
    return Response.json(info, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to reach anchor' },
      { status: 502 },
    );
  }
}
