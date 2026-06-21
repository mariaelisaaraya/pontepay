// Trustless Work — single-release escrow types + constants.
// Source of truth: the `trustless-work-dev` skill (skills/api/types.md, trustlines.md,
// core-concepts.md). PeerlyPay uses single-release escrows (one milestone) on testnet.

export const TW_TESTNET_BASE = 'https://dev.api.trustlesswork.com';
export const TW_MAINNET_BASE = 'https://api.trustlesswork.com';

// USDC issuer (the `trustline.address` is ALWAYS the G-issuer, never the C-contract;
// the TW API resolves the Soroban contract internally).
export const TRUSTLINES = {
  USDC_TESTNET: {
    address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    symbol: 'USDC',
    decimals: 7,
  },
  USDC_MAINNET: {
    address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    symbol: 'USDC',
    decimals: 7,
  },
} as const;

export const STELLAR_DECIMALS = 7;

export type EscrowRoles = {
  approver: string;
  serviceProvider: string;
  platformAddress: string;
  releaseSigner: string;
  disputeResolver: string;
  receiver: string;
};

export type Trustline = { address: string; symbol: string };

export type InitializeSingleReleaseEscrowPayload = {
  signer: string;
  engagementId: string;
  title: string;
  description: string;
  roles: EscrowRoles;
  amount: number; // human-readable (NOT stroops); deploy uses a number
  platformFee: number; // basis points (e.g. 100 = 1%)
  trustline: Trustline;
  // On deploy, ONLY `description` is valid per milestone — never `status`/`approved`.
  milestones: { description: string }[];
};

// GOTCHA (skill): fund-escrow's `amount` is sent as a STRING over REST, unlike deploy.
export type FundEscrowPayload = { contractId: string; signer: string; amount: string };

export type ChangeMilestoneStatusPayload = {
  contractId: string;
  milestoneIndex: string; // always a string, even though it looks numeric
  newStatus: string;
  newEvidence?: string;
  serviceProvider: string;
};

export type ApproveMilestonePayload = {
  contractId: string;
  milestoneIndex: string;
  approver: string;
  newEvidence?: string;
};

export type ReleaseFundsPayload = { contractId: string; releaseSigner: string };

export type StartDisputePayload = { contractId: string; signer: string };

export type ResolveDisputePayload = {
  contractId: string;
  disputeResolver: string;
  // amounts must sum to the CURRENT on-chain balance (post-fees), not the deposit.
  distributions: { address: string; amount: number }[];
};

export type EscrowFlags = {
  disputed?: boolean;
  released?: boolean;
  resolved?: boolean;
  approved?: boolean;
};

export type SingleReleaseEscrowStatus =
  | 'pending'
  | 'funded'
  | 'in_progress'
  | 'completed'
  | 'disputed'
  | 'resolved'
  | 'released';

// Response envelope for any write op (the unsigned XDR you must sign + submit).
export type UnsignedTxResponse = {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  unsignedTransaction?: string;
  contractId?: string;
  message?: string;
};

// 7-decimal helpers (USDC). TW single-release `amount` is human-readable; raw token
// transfers/balances are in stroops.
export function toStroops(amount: number): string {
  return BigInt(Math.round(amount * 10 ** STELLAR_DECIMALS)).toString();
}
export function fromStroops(stroops: string | number): number {
  return Number(BigInt(stroops)) / 10 ** STELLAR_DECIMALS;
}
