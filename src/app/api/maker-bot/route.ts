// Demo market-maker bot: confirms the fiat leg for orders created by the
// faucet account, releasing the escrowed USDC on-chain to the taker.
// It only ever acts on its OWN orders (creator == faucet public key) that are
// already in AwaitingConfirmation — a human seller's orders are untouched.

const CONTRACT_ID =
  process.env.NEXT_PUBLIC_P2P_CONTRACT_ID ??
  'CCCIAD3CI5I6MRQ6TDGKN7G3EMIH5OZS2EVAVJXO2U4NASPQL7Z7VS5R';
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

    if (order.status.tag !== 'AwaitingConfirmation') {
      return Response.json(
        { skipped: true, status: order.status.tag },
      );
    }

    const confirmTx = await client.confirm_fiat_payment({
      caller: kp.publicKey(),
      order_id: BigInt(orderId),
    });
    const sent = await confirmTx.signAndSend();

    return Response.json({
      confirmed: true,
      hash: sent.sendTransactionResponse?.hash ?? null,
    });
  } catch (e) {
    console.error('[maker-bot] failed:', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Maker bot failed' },
      { status: 502 },
    );
  }
}
