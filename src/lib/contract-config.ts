// Single source of truth for the deployed P2P contract id.
//
// Both the READ path (p2p.ts) and the WRITE path (p2p-crossmint.ts) must resolve
// to the SAME contract. Previously they diverged: writes fell back to a hardcoded
// id while reads fell back to the generated `networks.testnet.contractId`, so with
// no env var set the app read one contract and wrote to another. Centralize here.
//
// Override per environment with NEXT_PUBLIC_P2P_CONTRACT_ID; the fallback below
// matches `.env.example`. This instance is initialized AND has its Reflector
// price oracle configured (set_oracle), so `reference_rate` works on-chain.
export const DEFAULT_P2P_CONTRACT_ID =
  'CCCIAD3CI5I6MRQ6TDGKN7G3EMIH5OZS2EVAVJXO2U4NASPQL7Z7VS5R';

export function resolveP2PContractId(): string {
  return process.env.NEXT_PUBLIC_P2P_CONTRACT_ID?.trim() || DEFAULT_P2P_CONTRACT_ID;
}
