"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import {
  Wallet,
  User,
  Loader2,
  Copy,
  ExternalLink,
  Power,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useStellarWallet, getOrCreateLocalKeypair } from "@/lib/privy-wallet";
import { fetchUsdcTrustlineInfo } from "@/lib/wallet-balance";
import {
  loadProfileOverrides,
  resolveDisplayName,
  PROFILE_UPDATED_EVENT,
} from "@/lib/profile-overrides";

async function refreshBalanceForAddress(address: string, setBalance: (usdc: number, hasTrustline?: boolean) => void) {
  try {
    const { balance, hasTrustline } = await fetchUsdcTrustlineInfo(address);
    setBalance(balance, hasTrustline);
  } catch { /* ignore */ }
}

export default function WalletButton() {
  const { user: storeUser, connectWallet, disconnectWallet, setWalletStatus, setBalance } = useStore();
  const { login, logout, ready, authenticated, user: privyUser } = usePrivy();
  const { address: stellarAddress, wallet } = useStellarWallet();
  const { isConnected, walletAddress, balance } = storeUser;

  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const faucetInFlightRef = useRef(false);
  const prevBalanceRef = useRef<number | null>(null);

  // Incoming-funds notification: the 15s balance poll picks up received
  // payments; any increase after the initial load gets a toast.
  useEffect(() => {
    const current = balance.usdc;
    if (
      prevBalanceRef.current !== null &&
      current > prevBalanceRef.current + 1e-7
    ) {
      const diff = current - prevBalanceRef.current;
      toast.success(`Received ${diff.toFixed(2)} USDC`);
    }
    prevBalanceRef.current = current;
  }, [balance.usdc]);

  const activeWalletAddress = walletAddress ?? stellarAddress ?? null;

  // Re-read the saved profile when it changes (same tab via custom event,
  // other tabs via the native storage event).
  const [profileVersion, setProfileVersion] = useState(0);
  useEffect(() => {
    const bump = () => setProfileVersion((v) => v + 1);
    window.addEventListener(PROFILE_UPDATED_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const displayName = useMemo(() => {
    // profileVersion invalidates this memo when the profile is edited
    void profileVersion;
    const overrides = loadProfileOverrides();
    const key = activeWalletAddress ?? privyUser?.id ?? "guest";
    return resolveDisplayName(overrides[key], privyUser) ?? "Account";
  }, [activeWalletAddress, privyUser, profileVersion]);

  const accountEmail =
    privyUser?.email?.address ?? privyUser?.google?.email ?? null;

  // Sync Privy auth state into the store
  useEffect(() => {
    if (!ready) return;
    setWalletStatus(authenticated ? 'logged-in' : 'logged-out');
  }, [ready, authenticated, setWalletStatus]);

  useEffect(() => {
    if (!ready || !authenticated) {
      if (!authenticated) disconnectWallet();
      return;
    }

    // Case 1: Privy native Stellar wallet (future-proof)
    if (stellarAddress) {
      connectWallet(stellarAddress, null, 'logged-in');
      void refreshBalanceForAddress(stellarAddress, setBalance);
      runFaucet(stellarAddress, wallet);
      return;
    }

    // Case 2: Fallback — generate/load local keypair from localStorage
    if (privyUser?.id) {
      getOrCreateLocalKeypair(privyUser.id).then(({ address }) => {
        connectWallet(address, null, 'logged-in');
        void refreshBalanceForAddress(address, setBalance);
        runFaucet(address, wallet);
      }).catch(console.error);
    }
  }, [ready, authenticated, stellarAddress, privyUser?.id, connectWallet, disconnectWallet, wallet]);

  function runFaucet(address: string, w: typeof wallet) {
    const key = `pontepay_faucet_${address}`;
    if (localStorage.getItem(key) || !w) return;
    if (faucetInFlightRef.current) return;
    faucetInFlightRef.current = true;
    (async () => {
      try {
        const { Horizon, Networks, Transaction } = await import('@stellar/stellar-sdk');
        const server = new Horizon.Server('https://horizon-testnet.stellar.org');
        const prep = await fetch('/api/faucet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, step: 'prepare' }),
        }).then(r => r.json());
        if (!prep.xdr) {
          console.warn('[faucet] prepare failed:', prep.error ?? prep);
          return;
        }
        const signedXdr = await w.signEscrowXdr(prep.xdr);
        const signedTx = new Transaction(signedXdr, Networks.TESTNET);
        await server.submitTransaction(signedTx);
        const result = await fetch('/api/faucet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, step: 'send' }),
        }).then(r => r.json());
        if (result.success) {
          localStorage.setItem(key, '1');
          toast.success(`${result.amount ?? '0.9'} USDC added to your account!`);
        } else if (result.error === 'Already funded') {
          // Server already paid this address (e.g. a parallel run won the race)
          // — mark it locally so we stop retrying on every page load.
          localStorage.setItem(key, '1');
        } else {
          console.warn('[faucet] send failed:', result.error ?? result);
        }
      } catch (err) {
        console.warn('[faucet] failed (will retry on next login):', err);
      } finally {
        faucetInFlightRef.current = false;
      }
    })();
  }

  const refreshWalletBalance = useCallback(async () => {
    if (!activeWalletAddress || !authenticated) return;
    try {
      const { balance, hasTrustline } = await fetchUsdcTrustlineInfo(activeWalletAddress);
      setBalance(balance, hasTrustline);
    } catch (error) {
      console.error("Failed to fetch wallet balance", error);
    }
  }, [activeWalletAddress, authenticated, setBalance]);

  useEffect(() => {
    void refreshWalletBalance();
  }, [refreshWalletBalance]);

  useEffect(() => {
    if (!isOpen) return;
    void refreshWalletBalance();
  }, [isOpen, refreshWalletBalance]);

  // Poll balance every 15s so demo trades don't leave stale $0.00
  useEffect(() => {
    if (!activeWalletAddress || !authenticated) return;
    const interval = setInterval(() => {
      void refreshBalanceForAddress(activeWalletAddress, setBalance);
    }, 15_000);
    return () => clearInterval(interval);
  }, [activeWalletAddress, authenticated, setBalance]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleConnect = async () => {
    if (authenticated) return; // Privy ya tiene sesión — evita "already logged in"
    setIsConnecting(true);
    try {
      await login();
    } catch {
      toast.error("Could not sign in. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      disconnectWallet();
      setIsOpen(false);
      toast.info("Signed out successfully.");
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  };

  const handleCopyAddress = async () => {
    if (!activeWalletAddress) {
      toast.error("No account ID available.");
      return;
    }
    await navigator.clipboard.writeText(activeWalletAddress);
    toast.success("Account ID copied.");
    setIsOpen(false);
  };

  const handleOpenExplorer = () => {
    if (!activeWalletAddress) {
      toast.error("No account ID available.");
      return;
    }
    window.open(
      `https://stellar.expert/explorer/testnet/account/${activeWalletAddress}`,
      "_blank",
    );
    setIsOpen(false);
  };

  const formattedBalance = balance.usdc.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // --- Disconnected ---
  if (!isConnected) {
    // Spinner while Privy initializes or while local keypair is being resolved
    const isAuthLoading = !ready || isConnecting || (authenticated && !isConnected);

    return (
      <button
        disabled={isAuthLoading}
        onClick={handleConnect}
        className="flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 font-sans text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-800 active:scale-[0.97] disabled:opacity-70"
      >
        {isAuthLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <User className="size-4" />
            <span>Sign in</span>
          </>
        )}
      </button>
    );
  }

  // --- Connected ---
  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 font-sans text-sm transition-all duration-200 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary-700 text-white ring-1 ring-primary-200">
          <User className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <span className="max-w-32 truncate font-medium text-gray-700">{displayName}</span>
        <ChevronDown
          className={`size-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-gray-100 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-emerald-400" />
              <span className="truncate font-sans text-sm font-medium text-gray-700">
                {displayName}
              </span>
            </div>
            {accountEmail && (
              <p className="mt-0.5 truncate pl-4 font-sans text-xs text-gray-400">
                {accountEmail}
              </p>
            )}
          </div>

          <div className="border-b border-gray-100 px-4 py-4">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Available balance
            </p>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight text-gray-900">
              ${formattedBalance}
            </p>
            <p className="font-mono text-xs text-gray-500">
              ≈ {formattedBalance} USDC
            </p>
          </div>

          <div className="p-1.5">
            <button
              onClick={handleCopyAddress}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-sans text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Copy className="size-4 text-gray-400" />
              Copy account ID
            </button>

            <button
              onClick={handleOpenExplorer}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-sans text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ExternalLink className="size-4 text-gray-400" />
              View transactions
            </button>

            <div className="my-1 border-t border-gray-100" />

            <button
              onClick={handleDisconnect}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-sans text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              <Power className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
