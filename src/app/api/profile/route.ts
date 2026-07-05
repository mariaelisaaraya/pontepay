import { PrivyClient } from '@privy-io/server-auth';

// Server-side profile storage using Privy custom metadata (~1KB per user).
// The caller authenticates with their Privy access token; we verify it and
// only ever read/write the metadata of the token's own user.

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';
const APP_SECRET = process.env.PRIVY_APP_SECRET ?? '';

interface ProfileMetadata {
  displayName?: string;
  handle?: string;
  bio?: string;
}

function getClient(): PrivyClient | null {
  if (!APP_ID || !APP_SECRET) return null;
  return new PrivyClient(APP_ID, APP_SECRET);
}

async function authenticatedUserId(req: Request, privy: PrivyClient): Promise<string | null> {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  if (!token) return null;
  try {
    const claims = await privy.verifyAuthToken(token);
    return claims.userId;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const privy = getClient();
  if (!privy) {
    return Response.json({ demo: true, profile: null });
  }

  const userId = await authenticatedUserId(req, privy);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await privy.getUser(userId);
    const metadata = (user.customMetadata ?? {}) as ProfileMetadata;
    return Response.json({
      profile: {
        displayName: metadata.displayName ?? null,
        handle: metadata.handle ?? null,
        bio: metadata.bio ?? null,
      },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Failed to load profile' },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  const privy = getClient();
  if (!privy) {
    return Response.json(
      { demo: true, error: 'Profile sync disabled: set PRIVY_APP_SECRET' },
      { status: 503 },
    );
  }

  const userId = await authenticatedUserId(req, privy);
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { displayName, handle, bio } = (await req.json().catch(() => ({}))) as ProfileMetadata;

  if (!displayName || !handle) {
    return Response.json({ error: 'displayName and handle are required' }, { status: 400 });
  }

  // Privy custom metadata is limited (~1KB) — keep values bounded.
  const metadata = {
    displayName: displayName.slice(0, 80),
    handle: handle.slice(0, 40),
    bio: (bio ?? '').slice(0, 280),
  };

  try {
    await privy.setCustomMetadata(userId, metadata);
    return Response.json({ ok: true, profile: metadata });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Failed to save profile' },
      { status: 502 },
    );
  }
}
