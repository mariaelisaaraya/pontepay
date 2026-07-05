// Demo market-maker bot: confirms the fiat leg for orders created by the
// faucet account, releasing the escrowed USDC on-chain to the taker.
// It only ever acts on its OWN orders (creator == faucet public key) that are
// already in AwaitingConfirmation — a human seller's orders are untouched.

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_P2P_CONTRACT_ID ??
  'CAVPPFFQSDJ6ALZPPEDKFL3URUBUDEC6DSPH5S3RS5COEWBRXXBF3PMH';
const RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';

export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId || !/^\d+$/.test(orderId)) {
      return Response.json({ error: 'orderId (numeric) is required' }, { status: 400 });
    }

    const secret = process.env.FAUCET_SECRET_KEY;
    if (!secret) {
      return Response.json({ error: 'Maker bot not configured' }, { status: 503 });
    }

    const { Keypair } = await import('@stellar/stellar-sdk');
    const { basicNodeSigner } = await import('@stellar/stellar-sdk/contract');
    const { Client } = await import('@/contracts/p2p/src');

    const kp = Keypair.fromSecret(secret);
    const signer = basicNodeSigner(kp, PASSPHRASE);
    const client = new Client({
      contractId: CONTRACT_ID,
      rpcUrl: RPC_URL,
      networkPassphrase: PASSPHRASE,
      publicKey: kp.publicKey(),
      ...signer,
    });

    const readTx = await client.get_order({ order_id: BigInt(orderId) });
    const order = readTx.result.unwrap();

    if (order.creator !== kp.publicKey()) {
      return Response.json(
        { error: 'Order was not created by the maker bot' },
        { status: 403 },
      );
    }

    // The bot signs everything with ONE account, so simultaneous trades race
    // on its sequence number. Rebuild + retry with jitter on tx_bad_seq.
    const sendWithRetry = async (
      build: () => Promise<{ signAndSend: () => Promise<{ sendTransactionResponse?: { hash?: string } }> }>,
    ) => {
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 900)));
        }
        try {
          const tx = await build();
          return await tx.signAndSend();
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes('tx_bad_seq') && !msg.includes('TRY_AGAIN_LATER')) throw err;
        }
      }
      throw lastError;
    };

    // Bot as SELLER (sell order, from_crypto=true): the taker paid fiat and
    // the seller must confirm receipt, releasing escrow to the taker.
    if (order.status.tag === 'AwaitingConfirmation' && order.from_crypto) {
      const sent = await sendWithRetry(() =>
        client.confirm_fiat_payment({ caller: kp.publicKey(), order_id: BigInt(orderId) }),
      );
      return Response.json({
        action: 'confirm_fiat_payment',
        hash: sent.sendTransactionResponse?.hash ?? null,
      });
    }

    // Bot as BUYER (buy order, from_crypto=false): after a taker escrows
    // their USDC, the bot is the fiat payer and marks the ARS as sent. The
    // taker then confirms receipt to complete the trade.
    if (order.status.tag === 'AwaitingPayment' && !order.from_crypto) {
      const sent = await sendWithRetry(() =>
        client.submit_fiat_payment({ caller: kp.publicKey(), order_id: BigInt(orderId) }),
      );
      return Response.json({
        action: 'submit_fiat_payment',
        hash: sent.sendTransactionResponse?.hash ?? null,
      });
    }

    return Response.json({ skipped: true, status: order.status.tag });
  } catch (e) {
    console.error('[maker-bot] failed:', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Maker bot failed' },
      { status: 502 },
    );
  }
}
