"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpFromLine,
  ArrowDownToLine,
  TrendingUp,
  TrendingDown,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { useStellarWallet } from "@/lib/stellar/privy-wallet";
import { sendUsdc } from "@/lib/stellar/send-usdc";
import { fetchUsdcTrustlineInfo } from "@/lib/stellar/wallet-balance";
import DepositModal from "@/components/DepositModal";
import TradeDrawer from "@/components/TradeDrawer";
import SendModal from "@/components/SendModal";


const actions: { icon: typeof ArrowUpFromLine; labelKey: TranslationKey; id: string }[] = [
  { icon: ArrowUpFromLine, labelKey: "home.send", id: "send" },
  { icon: ArrowDownToLine, labelKey: "home.receive", id: "receive" },
  { icon: TrendingUp, labelKey: "home.buy", id: "buy" },
  { icon: TrendingDown, labelKey: "home.sell", id: "sell" },
  { icon: Landmark, labelKey: "home.anchor", id: "anchor" },
];

export default function QuickActions() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, setBalance } = useStore();
  const { wallet } = useStellarWallet();
  const [depositOpen, setDepositOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [sendOpen, setSendOpen] = useState(false);
  const walletAddress = user.walletAddress ?? "";

  const handleAction = (id: string) => {
    switch (id) {
      case "send":
        setSendOpen(true);
        break;
      case "receive":
        setDepositOpen(true);
        break;
      case "buy":
        setTradeMode("buy");
        setTradeOpen(true);
        break;
      case "sell":
        setTradeMode("sell");
        setTradeOpen(true);
        break;
      case "anchor":
        router.push("/anchor");
        break;
      default:
        toast.info(`${id.charAt(0).toUpperCase() + id.slice(1)} coming soon`);
    }
  };

  return (
    <>
      <div className="mt-6 flex gap-2">
        {actions.map(({ icon: Icon, labelKey, id }) => (
          <button
            key={id}
            onClick={() => handleAction(id)}
            className="flex h-[71px] flex-1 flex-col items-center justify-center gap-1 rounded-[14px] border border-primary-500 bg-white transition-colors hover:bg-primary-50"
          >
            <Icon className="size-6 text-primary-500" strokeWidth={1.5} />
            <span className="text-[12px] font-medium leading-5 text-[#4a5464]">
              {t(labelKey)}
            </span>
          </button>
        ))}
      </div>

      <SendModal
        isOpen={sendOpen}
        onClose={() => setSendOpen(false)}
        availableUsdc={user.balance.usdc}
        onSend={async (amount, recipient, memo) => {
          if (!wallet || !walletAddress) {
            throw new Error("Wallet not ready — sign in first");
          }
          const hash = await sendUsdc(wallet, walletAddress, recipient, amount, memo);
          // Refresh the real on-chain balance after the transfer confirms.
          const { balance, hasTrustline } = await fetchUsdcTrustlineInfo(walletAddress);
          setBalance(balance, hasTrustline);
          return hash;
        }}
      />

      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        walletAddress={walletAddress}
      />

      <TradeDrawer
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        mode={tradeMode}
      />
    </>
  );
}
