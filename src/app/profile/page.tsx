"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Wallet, CalendarDays, LogOut, ArrowLeftRight, Globe, Shield, Mail } from "lucide-react";
import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";

import EditProfileDrawer, {
  type EditableProfile,
} from "@/components/profile/EditProfileDrawer";
import ProfileAvatarModal from "@/components/profile/ProfileAvatarModal";
import ShareProfileDrawer from "@/components/profile/ShareProfileDrawer";
import { useTradeHistory } from "@/contexts/TradeHistoryContext";
import { useUser } from "@/contexts/UserContext";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  loadProfileOverrides,
  saveProfileOverrides,
  resolveDisplayName,
  type ProfileOverrides,
} from "@/lib/profile-overrides";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, loading } = useUser();
  const { user: privyUser, authenticated, getAccessToken } = usePrivy();
  const { trades } = useTradeHistory();
  const connectedWalletAddress = useStore((s) => s.user.walletAddress);

  // Email from the Privy login (email login or Google account)
  const accountEmail = privyUser?.email?.address ?? privyUser?.google?.email ?? null;
  const [copied, setCopied] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [profileOverrides, setProfileOverrides] = useState<ProfileOverrides>(
    () => loadProfileOverrides(),
  );
  const activeWalletAddress = connectedWalletAddress;

  const createdDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const shortWallet = activeWalletAddress
    ? `${activeWalletAddress.slice(0, 6)}...${activeWalletAddress.slice(-4)}`
    : t('profile.notConnected');

  const profileStorageKey = activeWalletAddress ?? privyUser?.id ?? "guest";
  const storedProfile = profileOverrides[profileStorageKey];

  // Pull the server-synced profile (Privy custom metadata) so edits follow the
  // user across devices; localStorage stays as the offline cache the header reads.
  useEffect(() => {
    if (!authenticated) return;
    let active = true;

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const { profile } = (await res.json()) as {
          profile: { displayName: string | null; handle: string | null; bio: string | null } | null;
        };
        if (!active || !profile?.displayName || !profile.handle) return;

        setProfileOverrides((current) => {
          const next = {
            ...current,
            [profileStorageKey]: {
              displayName: profile.displayName as string,
              handle: profile.handle as string,
              bio: profile.bio ?? undefined,
            },
          };
          try {
            saveProfileOverrides(next);
          } catch {
            // keep in-memory copy even if localStorage write fails
          }
          return next;
        });
      } catch {
        // offline / server unavailable — local profile still works
      }
    })();

    return () => {
      active = false;
    };
  }, [authenticated, getAccessToken, profileStorageKey]);

  // Defaults come from the Privy login identity (Google name / email user),
  // not from a made-up wallet-derived name.
  const emailUser = accountEmail?.split("@")[0] ?? null;
  const defaultDisplayName =
    resolveDisplayName(undefined, privyUser) ??
    (activeWalletAddress
      ? `Ponte ${activeWalletAddress.slice(2, 6).toLowerCase()}`
      : "Guest user");

  const defaultHandle = emailUser
    ? `@${emailUser.toLowerCase()}`
    : activeWalletAddress
      ? `@${activeWalletAddress.slice(4, 10).toLowerCase()}`
      : "@guest";

  const defaultBio = user
    ? "Fast, secure P2P trading on PontePay."
    : "Create your profile to start trading on PontePay.";

  const currentProfile = {
    displayName: storedProfile?.displayName ?? defaultDisplayName,
    handle: storedProfile?.handle ?? defaultHandle,
    bio: storedProfile?.bio ?? defaultBio,
  };

  const trustScore = activeWalletAddress
    ? (parseInt(activeWalletAddress.slice(2, 6), 36) % 31) + 69
    : 75;

  const handleCopyWallet = async () => {
    if (!activeWalletAddress) {
      toast.error("No wallet connected");
      return;
    }

    try {
      await navigator.clipboard.writeText(activeWalletAddress);
      toast.success("Wallet copied");
    } catch {
      toast.error("Failed to copy wallet");
    } finally {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleComingSoon = (label: string) => {
    toast.info(`${label} coming soon`);
  };

  const handleSaveProfile = (nextProfile: EditableProfile) => {
    const nextProfileOverrides = {
      ...profileOverrides,
      [profileStorageKey]: {
        displayName: nextProfile.displayName,
        handle: nextProfile.handle,
        bio: nextProfile.bio,
      },
    };

    setProfileOverrides(nextProfileOverrides);

    try {
      saveProfileOverrides(nextProfileOverrides);
    } catch {
      toast.error("Failed to persist profile changes");
    }

    // Sync to Privy custom metadata so the profile follows the user across devices.
    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(nextProfile),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { demo?: boolean };
          if (!data.demo) {
            toast.error("Saved locally, but cloud sync failed");
          }
        }
      } catch {
        toast.error("Saved locally, but cloud sync failed");
      }
    })();

    toast.success("Profile updated");
  };

  if (loading) {
    return (
      <div className="space-y-5 py-2">
        <div className="h-56 rounded-2xl border border-gray-200 bg-white" />
        <div className="h-24 rounded-2xl border border-gray-200 bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-7 py-4">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-32 bg-gradient-to-r from-primary-700 to-primary-600" />

        <div className="absolute top-32 left-5 z-10 -translate-y-1/2">
          <ProfileAvatarModal
            open={isAvatarModalOpen}
            onOpenChange={setIsAvatarModalOpen}
          />
        </div>

        <div className="px-5 pb-7 pt-10">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl font-semibold text-gray-900">
                {currentProfile.displayName}
              </p>
              <p className="text-sm text-gray-500">{currentProfile.handle}</p>
              <p className="mt-2.5 text-sm leading-relaxed text-gray-600">
                {currentProfile.bio}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <EditProfileDrawer
                open={isEditDrawerOpen}
                onOpenChange={setIsEditDrawerOpen}
                initialProfile={currentProfile}
                onSave={handleSaveProfile}
              />
              <ShareProfileDrawer
                open={isShareDrawerOpen}
                onOpenChange={setIsShareDrawerOpen}
                displayName={currentProfile.displayName}
                handle={currentProfile.handle}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">{t('profile.completedTrades')}</p>
              <p className="text-sm font-semibold text-gray-900">{trades.length}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">{t('profile.trustScore')}</p>
              <p className="text-sm font-semibold text-gray-900">
                {trustScore}/100
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {accountEmail && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                <Mail className="size-4 text-gray-400" />
                <span className="text-sm text-gray-500">{t('profile.email')}</span>
                <span className="ml-auto truncate text-xs text-gray-900">
                  {accountEmail}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
              <Wallet className="size-4 text-gray-400" />
              <span className="text-sm text-gray-500">{t('profile.wallet')}</span>
              <span className="ml-auto font-mono text-xs text-gray-900">
                {shortWallet}
              </span>
              <button
                type="button"
                onClick={handleCopyWallet}
                className={`inline-flex size-7 items-center justify-center rounded-lg border transition-colors ${
                  copied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
                }`}
                aria-label="Copy wallet"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
              <CalendarDays className="size-4 text-gray-400" />
              <span className="text-sm text-gray-500">{t('profile.joined')}</span>
              <span className="ml-auto text-sm font-medium text-gray-900">
                {createdDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/wallet/bridge"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          <ArrowLeftRight className="size-4" />
          Move funds from another app
        </Link>

        <Link
          href="/corridor"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100"
        >
          <Globe className="size-4" />
          Send money to Brazil
        </Link>

        <Link
          href="/profile/liquidity-provider"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Become a seller
        </Link>

        <button
          type="button"
          onClick={() => handleComingSoon("Sign out")}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
