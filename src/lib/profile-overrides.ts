// User-editable profile fields, persisted in localStorage keyed by wallet
// address (fallback: Privy user id). Shared by the Profile page (editing)
// and the header WalletButton (display).

export interface ProfileOverride {
  displayName: string;
  handle: string;
  bio?: string;
}

export type ProfileOverrides = Record<string, ProfileOverride>;

const STORAGE_KEY = 'pontepay_profile_overrides';
export const PROFILE_UPDATED_EVENT = 'pontepay:profile-updated';

export function loadProfileOverrides(): ProfileOverrides {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveProfileOverrides(overrides: ProfileOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  // Same-tab listeners (e.g. the header) re-read on this event; the native
  // 'storage' event only fires in other tabs.
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

/** Best display name available: saved override → Google name → email user → null. */
export function resolveDisplayName(
  override: ProfileOverride | undefined,
  privyUser: { google?: { name?: string | null } | null; email?: { address?: string } | null } | null,
): string | null {
  if (override?.displayName) return override.displayName;
  const googleName = privyUser?.google?.name;
  if (googleName) return googleName;
  const email = privyUser?.email?.address;
  if (email) return email.split('@')[0];
  return null;
}
