export interface MakerPaymentDetails {
  accountHolder: string;
  bank?: string;
  cbu?: string;
  alias?: string;
  phone?: string;
}

const KEY_PREFIX = 'pontepay_payment_details:';

export function saveMakerPaymentDetails(walletAddress: string, details: MakerPaymentDetails): void {
  try {
    localStorage.setItem(KEY_PREFIX + walletAddress, JSON.stringify(details));
  } catch {
    // ignore storage errors (private browsing, quota)
  }
}

export function getMakerPaymentDetails(walletAddress: string): MakerPaymentDetails | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + walletAddress);
    if (!raw) return null;
    return JSON.parse(raw) as MakerPaymentDetails;
  } catch {
    return null;
  }
}
