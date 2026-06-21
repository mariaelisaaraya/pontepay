import type { EscrowRoles } from './types';

// Map a PeerlyPay P2P trade onto Trustless Work single-release escrow roles.
//
// The escrow ALWAYS custodies the crypto (USDC). Whoever gives up USDC funds the
// escrow (signs fund_escrow); whoever pays local fiat receives the USDC. The single
// milestone represents "fiat was paid and received".
//
//   - serviceProvider = the fiat payer        (proves fiat sent → change_milestone_status)
//   - approver        = the crypto seller     (confirms fiat received → approve_milestone)
//   - releaseSigner   = the crypto seller     (releases USDC → release_funds; same actor as approver)
//   - receiver        = the fiat payer        (gets the USDC)
//   - platformAddress = PeerlyPay platform    (owner; collects platform fee)
//   - disputeResolver = PeerlyPay platform    (arbiter; cannot itself open a dispute)
//
// NOTE: the funder (fund_escrow signer) is NOT an escrow role — it's the crypto seller.
// serviceProvider !== approver by construction (avoids self-approval).
export type TradeParties = {
  platform: string; // PeerlyPay platform Stellar address
  cryptoSeller: string; // gives up USDC, funds the escrow
  fiatPayer: string; // pays local fiat, receives USDC
};

export function escrowRolesForTrade(p: TradeParties): EscrowRoles {
  return {
    serviceProvider: p.fiatPayer,
    approver: p.cryptoSeller,
    releaseSigner: p.cryptoSeller,
    receiver: p.fiatPayer,
    platformAddress: p.platform,
    disputeResolver: p.platform,
  };
}

// Resolve the two trade parties from a PeerlyPay order's `from_crypto` flag.
//   from_crypto = true  → maker SELLS crypto (maker = cryptoSeller, taker = fiatPayer)
//   from_crypto = false → maker BUYS crypto  (taker = cryptoSeller, maker = fiatPayer)
export function partiesFromOrder(args: {
  platform: string;
  fromCrypto: boolean;
  maker: string;
  taker: string;
}): TradeParties {
  const { platform, fromCrypto, maker, taker } = args;
  return fromCrypto
    ? { platform, cryptoSeller: maker, fiatPayer: taker }
    : { platform, cryptoSeller: taker, fiatPayer: maker };
}

// Who funds the escrow (signs fund_escrow) = the crypto seller.
export function funderForTrade(p: TradeParties): string {
  return p.cryptoSeller;
}
