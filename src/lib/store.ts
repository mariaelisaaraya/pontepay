import { create } from "zustand";
import {
  User,
  Order,
  CreateOrderInput,
  P2POrderStatus,
  FiatCurrencyCode,
  PaymentMethodCode,
} from "@/types";
import {
  durationLabel,
  fiatCurrencyLabel,
  paymentMethodLabel,
} from "@/lib/order-mapper";
import { loadOrdersFromContract } from "@/lib/p2p";

// Demo orders shown alongside real chain orders so the marketplace/flow is
// always testable. Their ids start with "demo-" and the trade flow runs in demo
// mode (no on-chain writes). Set NEXT_PUBLIC_DEMO_ORDERS=false to hide them and
// show only real on-chain orders. Seed the contract (`make p2p-seed-orders`)
// to have real, takeable orders.
const DEMO_ORDERS_ENABLED = process.env.NEXT_PUBLIC_DEMO_ORDERS !== 'false';

const DEMO_ORDERS: Order[] = [
  {
    id: "demo-1",
    orderId: BigInt(0),
    type: "sell",
    totalAmount: 150,
    remainingAmount: 150,
    filledAmount: 0,
    activeFillAmount: 0,
    amount: 150,
    rate: 1460,
    fiatCurrencyCode: FiatCurrencyCode.Ars,
    fiatCurrencyLabel: fiatCurrencyLabel(FiatCurrencyCode.Ars),
    paymentMethodCode: PaymentMethodCode.MercadoPago,
    paymentMethodLabel: paymentMethodLabel(PaymentMethodCode.MercadoPago),
    durationSecs: 604800,
    durationLabel: durationLabel(604800),
    status: "AwaitingFiller",
    createdAt: new Date(),
    createdBy: "GDEMOLUCIAAR000000000000000000000000000000000000000DEMO",
    displayName: "Lucía M. (demo)",
    isVerified: true,
    completionRate: 98,
    reputation_score: 142,
  },
  {
    id: "demo-2",
    orderId: BigInt(0),
    type: "buy",
    totalAmount: 80,
    remainingAmount: 80,
    filledAmount: 0,
    activeFillAmount: 0,
    amount: 80,
    rate: 1455,
    fiatCurrencyCode: FiatCurrencyCode.Ars,
    fiatCurrencyLabel: fiatCurrencyLabel(FiatCurrencyCode.Ars),
    paymentMethodCode: PaymentMethodCode.BankTransfer,
    paymentMethodLabel: paymentMethodLabel(PaymentMethodCode.BankTransfer),
    durationSecs: 259200,
    durationLabel: durationLabel(259200),
    status: "AwaitingFiller",
    createdAt: new Date(),
    createdBy: "GDEMOMATEOAR00000000000000000000000000000000000000DEMO",
    displayName: "Mateo R. (demo)",
    isVerified: false,
    completionRate: 91,
    reputation_score: 37,
  },
  {
    id: "demo-3",
    orderId: BigInt(0),
    type: "sell",
    totalAmount: 300,
    remainingAmount: 300,
    filledAmount: 0,
    activeFillAmount: 0,
    amount: 300,
    rate: 1468,
    fiatCurrencyCode: FiatCurrencyCode.Ars,
    fiatCurrencyLabel: fiatCurrencyLabel(FiatCurrencyCode.Ars),
    paymentMethodCode: PaymentMethodCode.MobileWallet,
    paymentMethodLabel: paymentMethodLabel(PaymentMethodCode.MobileWallet),
    durationSecs: 86400,
    durationLabel: durationLabel(86400),
    status: "AwaitingFiller",
    createdAt: new Date(),
    createdBy: "GDEMOSOFIAAR00000000000000000000000000000000000000DEMO",
    displayName: "Sofía D. (demo)",
    isVerified: true,
    completionRate: 100,
    reputation_score: 205,
  },
];

// Store contract and actions
interface AppState {
  user: User;
  orders: Order[];
  connectWallet: (
    walletAddress: string,
    walletOwner?: string | null,
    walletStatus?: string | null,
  ) => void;
  setWalletStatus: (walletStatus: string | null) => void;
  disconnectWallet: () => void;
  setBalance: (usdc: number, hasTrustline?: boolean) => void;
  addBalance: (amount: number) => void;
  subtractBalance: (amount: number) => boolean;
  createOrder: (input: CreateOrderInput) => void;
  updateOrderStatus: (orderId: string, status: P2POrderStatus) => void;
  refreshOrdersFromChain: () => Promise<void>;
}

// Initial in-memory state
export const useStore = create<AppState>((set) => ({
  user: {
    walletAddress: null,
    walletOwner: null,
    walletStatus: "logged-out",
    isConnected: false,
    balance: {
      usd: 0,
      usdc: 0,
    },
    // Placeholder: no on-chain reputation source yet (see types/index.ts).
    reputation_score: 0,
  },
  // Orders are the on-chain source of truth (loaded by ChainOrdersBootstrap via
  // refreshOrdersFromChain). Demo orders are appended unless
  // NEXT_PUBLIC_DEMO_ORDERS=false, so the marketplace/flow stays testable.
  orders: DEMO_ORDERS_ENABLED ? DEMO_ORDERS : [],

  // Wallet session actions
  connectWallet: (
    walletAddress,
    walletOwner = null,
    walletStatus = "logged-in",
  ) => {
    set((state) => ({
      user: {
        ...state.user,
        walletAddress,
        walletOwner,
        walletStatus,
        isConnected: true,
        // Placeholder: no on-chain reputation source yet (see types/index.ts).
        reputation_score: state.user.reputation_score ?? 0,
      },
    }));
  },

  setWalletStatus: (walletStatus) => {
    set((state) => ({
      user: {
        ...state.user,
        walletStatus,
      },
    }));
  },

  disconnectWallet: () => {
    set((state) => ({
      user: {
        ...state.user,
        walletAddress: null,
        walletOwner: null,
        walletStatus: "logged-out",
        isConnected: false,
        balance: {
          usd: 0,
          usdc: 0,
        },
      },
    }));
  },

  // Balance actions
  setBalance: (usdc, hasTrustline) => {
    const normalized = Math.max(0, Math.round(usdc * 100) / 100);

    set((state) => ({
      user: {
        ...state.user,
        balance: {
          usd: normalized,
          usdc: normalized,
        },
        ...(hasTrustline !== undefined ? { hasTrustline } : {}),
      },
    }));
  },

  addBalance: (amount) => {
    set((state) => {
      const next = Math.max(
        0,
        Math.round((state.user.balance.usdc + amount) * 100) / 100,
      );

      return {
        user: {
          ...state.user,
          balance: {
            usd: next,
            usdc: next,
          },
        },
      };
    });
  },

  subtractBalance: (amount) => {
    let success = false;

    set((state) => {
      if (state.user.balance.usdc < amount) {
        return state;
      }

      success = true;
      const next = Math.max(
        0,
        Math.round((state.user.balance.usdc - amount) * 100) / 100,
      );

      return {
        user: {
          ...state.user,
          balance: {
            usd: next,
            usdc: next,
          },
        },
      };
    });

    return success;
  },

  // Order actions
  createOrder: (input: CreateOrderInput) => {
    set((state) => ({
      orders: [
        ...state.orders,
        {
          id: `${Date.now()}`,
          orderId: BigInt(Date.now()),
          ...input,
          totalAmount: input.amount,
          remainingAmount: input.amount,
          filledAmount: 0,
          activeFillAmount: 0,
          fiatCurrencyLabel: fiatCurrencyLabel(input.fiatCurrencyCode),
          paymentMethodLabel: paymentMethodLabel(input.paymentMethodCode),
          paymentMethodLabels: input.paymentMethodCodes
            ? input.paymentMethodCodes.map((c) => paymentMethodLabel(c))
            : [paymentMethodLabel(input.paymentMethodCode)],
          paymentMethodCodes: input.paymentMethodCodes ?? [
            input.paymentMethodCode,
          ],
          minTradeAmount: input.minTradeAmount,
          maxTradeAmount: input.maxTradeAmount,
          durationLabel: durationLabel(input.durationSecs),
          status: "AwaitingFiller",
          createdAt: new Date(),
          createdBy: state.user.walletAddress ?? "wallet-not-connected",
          // Placeholder: no on-chain reputation source yet (see types/index.ts).
          reputation_score: state.user.reputation_score ?? 0,
        },
      ],
    }));
  },

  updateOrderStatus: (orderId: string, status: P2POrderStatus) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    }));
  },

  // On-chain sync actions
  refreshOrdersFromChain: async () => {
    try {
      const chainOrders = await loadOrdersFromContract();
      // Real orders come first so they take priority in matching; demo orders
      // are appended only when the flag allows them.
      set({ orders: DEMO_ORDERS_ENABLED ? [...chainOrders, ...DEMO_ORDERS] : chainOrders });
    } catch (error) {
      console.error("Failed to refresh orders from contract", error);
      set({ orders: DEMO_ORDERS_ENABLED ? DEMO_ORDERS : [] });
    }
  },
}));
