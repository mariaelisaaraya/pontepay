import { NextRequest } from 'next/server';

const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const FAUCET_AMOUNT = '10';

// Module-level set — persists across invocations in the same process instance.
// Guards against rapid abuse within a single Vercel function container.
const funded = new Set<string>();

// Step 1: fund with Friendbot and return unsigned changeTrust XDR
// Step 2: after client signs + submits the trustline, send USDC
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, step = 'prepare' } = body as { address: string; step?: string };

    if (!address || !/^G[A-Z0-9]{55}$/.test(address)) {
      return Response.json({ error: 'Invalid Stellar address' }, { status: 400 });
    }

    // Server-side guard: reject if already funded in this process instance
    if (step === 'send' && funded.has(address)) {
      return Response.json({ error: 'Already funded' }, { status: 429 });
    }

    const secret = process.env.FAUCET_SECRET_KEY;
    if (!secret) {
      return Response.json({ error: 'Faucet not configured' }, { status: 503 });
    }

    const {
      Keypair,
      TransactionBuilder,
      Networks,
      Asset,
      Operation,
      Horizon,
    } = await import('@stellar/stellar-sdk');

    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const faucetKeypair = Keypair.fromSecret(secret);
    const USDC = new Asset('USDC', USDC_ISSUER);

    if (step === 'prepare') {
      // Fund with Friendbot
      await fetch(`https://friendbot.stellar.org?addr=${address}`).catch(() => null);
      // Wait for Friendbot to settle
      await new Promise(r => setTimeout(r, 2000));

      // Build unsigned changeTrust XDR for the user to sign
      const userAccount = await server.loadAccount(address);
      const trustlineTx = new TransactionBuilder(userAccount, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.changeTrust({ asset: USDC }))
        .setTimeout(30)
        .build();

      return Response.json({ step: 'sign-trustline', xdr: trustlineTx.toXDR() });
    }

    if (step === 'send') {
      // Trustline already established — send USDC
      const faucetAccount = await server.loadAccount(faucetKeypair.publicKey());
      const tx = new TransactionBuilder(faucetAccount, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: address,
            asset: USDC,
            amount: FAUCET_AMOUNT,
          }),
        )
        .setTimeout(30)
        .build();

      tx.sign(faucetKeypair);
      const result = await server.submitTransaction(tx);
      funded.add(address);
      return Response.json({ success: true, hash: result.hash, amount: FAUCET_AMOUNT });
    }

    return Response.json({ error: 'Unknown step' }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Faucet failed';
    return Response.json({ error: msg }, { status: 500 });
  }
}
