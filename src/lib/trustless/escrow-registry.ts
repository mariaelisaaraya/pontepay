// Local registry of Trustless Work escrow contract ids.
//
// Trustless Work deploys ONE contract instance per escrow (one order = one contract).
// There is no on-chain "list all orders" call, so the app tracks the contract ids it
// created/observed here (localStorage). Listing then reads each instance via the TW
// indexer (`/helper/get-escrow-by-contract-ids` or `/helper/get-escrows-by-signer`).
// Treat this as a cache: always re-read with `validateOnChain=true` before release,
// dispute, or resolve.

export type EscrowRegistryEntry = {
  contractId: string;
  engagementId: string;
  createdAt: number;
  fromCrypto?: boolean;
  amount?: number;
  fiatCurrencyCode?: number;
  exchangeRate?: number;
  status?: string; // last-known status snapshot for fast listing
};

const KEY = 'pontepay.escrow.registry.v1';

function read(): EscrowRegistryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EscrowRegistryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: EscrowRegistryEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function listEscrows(): EscrowRegistryEntry[] {
  return read();
}

export function listEscrowIds(): string[] {
  return read().map((e) => e.contractId);
}

export function addEscrow(entry: EscrowRegistryEntry): void {
  const all = read().filter((e) => e.contractId !== entry.contractId);
  all.unshift(entry);
  write(all);
}

export function updateEscrow(contractId: string, patch: Partial<EscrowRegistryEntry>): void {
  write(read().map((e) => (e.contractId === contractId ? { ...e, ...patch } : e)));
}

export function getEscrow(contractId: string): EscrowRegistryEntry | undefined {
  return read().find((e) => e.contractId === contractId);
}

export function removeEscrow(contractId: string): void {
  write(read().filter((e) => e.contractId !== contractId));
}
