// SEP-31 Cross-Border Payment client.
//
// SEP-31 is the direct payment protocol: a sending entity (app or anchor)
// submits a payment to a receiving anchor, which delivers local fiat to the
// recipient. For PeerlyPay the narrative is:
//   ARS (P2P escrow leg) → USDC on Stellar (SEP-31 send leg) → BRL (anchor delivers via PIX)
//
// All network calls go through /api/sep31 to avoid CORS.

export const DEFAULT_SEP31_DOMAIN = 'testanchor.stellar.org';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Sep31AssetField {
  description: string;
  optional?: boolean;
  choices?: string[];
}

export interface Sep31Asset {
  enabled: boolean;
  min_amount?: number;
  max_amount?: number;
  sender_sep12_type?: string;
  receiver_sep12_type?: string;
  fields?: {
    transaction?: Record<string, Sep31AssetField>;
    sender?: Record<string, Sep31AssetField>;
    receiver?: Record<string, Sep31AssetField>;
  };
}

export interface Sep31Info {
  receive: Record<string, Sep31Asset>;
}

export interface Sep31TransactionRequest {
  amount: string;
  asset_code: string;
  asset_issuer?: string;
  sender_id?: string;
  receiver_id?: string;
  fields?: {
    transaction?: Record<string, string>;
  };
  lang?: string;
}

export interface Sep31TransactionResponse {
  id: string;
  stellar_account_id: string;
  stellar_memo?: string;
  stellar_memo_type?: string;
}

export type Sep31Status =
  | 'pending_sender'
  | 'pending_stellar'
  | 'pending_customer_info_update'
  | 'pending_receiver'
  | 'pending_external'
  | 'completed'
  | 'error';

export interface Sep31Transaction {
  id: string;
  status: Sep31Status;
  status_message?: string;
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  stellar_transaction_id?: string;
  external_transaction_id?: string;
  completed_at?: string;
}

// ─── API calls (via server proxy to avoid CORS) ───────────────────────────────

export async function fetchSep31Info(
  domain: string = DEFAULT_SEP31_DOMAIN,
): Promise<Sep31Info> {
  const res = await fetch(
    `/api/sep31?action=info&domain=${encodeURIComponent(domain)}`,
  );
  if (!res.ok) throw new Error(`SEP-31 /info failed: HTTP ${res.status}`);
  return res.json() as Promise<Sep31Info>;
}

export async function initiateSep31Payment(
  domain: string,
  payload: Sep31TransactionRequest,
): Promise<Sep31TransactionResponse> {
  const res = await fetch('/api/sep31', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `SEP-31 initiate failed: HTTP ${res.status}`);
  }
  return res.json() as Promise<Sep31TransactionResponse>;
}

export async function fetchSep31Transaction(
  domain: string,
  id: string,
): Promise<Sep31Transaction> {
  const res = await fetch(
    `/api/sep31?action=transaction&domain=${encodeURIComponent(domain)}&id=${encodeURIComponent(id)}`,
  );
  if (!res.ok) throw new Error(`SEP-31 /transactions/${id} failed: HTTP ${res.status}`);
  const data = await res.json() as { transaction: Sep31Transaction };
  return data.transaction;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Discover the SEP-31 DIRECT_PAYMENT_SERVER from a stellar.toml */
export async function fetchSep31Server(
  domain: string = DEFAULT_SEP31_DOMAIN,
): Promise<string | null> {
  try {
    const res = await fetch(`https://${domain}/.well-known/stellar.toml`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const toml = await res.text();
    const match = toml.match(/^\s*DIRECT_PAYMENT_SERVER\s*=\s*"([^"]+)"/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
