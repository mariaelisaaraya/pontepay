"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import { fetchWalletUsdcBalance } from "@/lib/wallet-balance";

export default function WalletButton() {
  const { user: storeUser, connectWallet, disconnectWallet, setWalletStatus, setBalance } = useStore();
  const { login, logout, ready, authenticated, user: privyUser } = usePrivy();
  const { address: stellarAddress, wallet } = useStellarWallet();
  const { isConnected, walletAddress, balance } = storeUser;

  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWalletAddress = walletAddress ?? stellarAddress ?? null;

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
      runFaucet(stellarAddress, wallet);
      return;
    }

    // Case 2: Fallback — generate/load local keypair from localStorage
    if (privyUser?.id) {
      getOrCreateLocalKeypair(privyUser.id).then(({ address }) => {
        connectWallet(address, null, 'logged-in');
        runFaucet(address, wallet);
      }).catch(console.error);
    }
  }, [ready, authenticated, stellarAddress, privyUser?.id, connectWallet, disconnectWallet, wallet]);

  function runFaucet(address: string, w: typeof wallet) {
    const key = `pontepay_faucet_${address}`;
    if (localStorage.getItem(key) || !w) return;
    (async () => {
      try {
        const { Horizon, Networks, Transaction } = await import('@stellar/stellar-sdk');
        const server = new Horizon.Server('https://horizon-testnet.stellar.org');
        const prep = await fetch('/api/faucet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, step: 'prepare' }),
        }).then(r => r.json());
        if (!prep.xdr) return;
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
          toast.success('5 USDC added to your account!');
        }
      } catch { /* retryable */ }
    })();
  }

  const refreshWalletBalance = useCallback(async () => {
    if (!activeWalletAddress || !authenticated) return;
    try {
      const usdc = await fetchWalletUsdcBalance(activeWalletAddress);
      setBalance(usdc);
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
        className="flex items-center gap-2 rounded-lg bg-magenta px-4 py-2 font-sans text-sm font-semibold text-white transition-all duration-200 hover:bg-magenta-600 active:scale-[0.97] disabled:opacity-70"
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
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-fuchsia-500 text-white ring-1 ring-fuchsia-200">
          <User className="size-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <span className="font-medium text-gray-700">Account</span>
        <ChevronDown
          className={`size-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-gray-100 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <span className="inline-flex size-2 rounded-full bg-emerald-400" />
            <span className="font-sans text-sm font-medium text-gray-700">
              Active
            </span>
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
