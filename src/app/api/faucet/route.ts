import { NextRequest } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const FAUCET_AMOUNT = '0.9';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET ?? '';

// Only logged-in users may drain the faucet. When Privy server creds are not
// configured (local dev without secrets) the check is skipped so the faucet
// keeps working — same convention as /api/profile.
async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) return true;
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  if (!token) return false;
  try {
    await new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET).verifyAuthToken(token);
    return true;
  } catch {
    return false;
  }
}

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

    if (!(await isAuthorized(req))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
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
      // Fund with Friendbot, retrying: under launch-day load Friendbot rate
      // limits and Horizon may lag a few seconds before the account exists.
      let userAccount = null;
      for (let attempt = 0; attempt < 4 && !userAccount; attempt++) {
        await fetch(`https://friendbot.stellar.org?addr=${address}`).catch(() => null);
        await new Promise(r => setTimeout(r, 1500 + attempt * 1500));
        userAccount = await server.loadAccount(address).catch(() => null);
      }
      if (!userAccount) {
        return Response.json(
          { error: 'Testnet funding is busy — please retry in a few seconds' },
          { status: 503 },
        );
      }
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
      // On-chain double-funding guard: the in-memory set doesn't survive
      // across serverless instances, but a positive USDC balance does.
      const recipient = await server.loadAccount(address);
      const usdcLine = recipient.balances.find(
        (b) =>
          'asset_code' in b &&
          b.asset_code === 'USDC' &&
          'asset_issuer' in b &&
          b.asset_issuer === USDC_ISSUER,
      );
      if (usdcLine && parseFloat(usdcLine.balance) > 0) {
        funded.add(address);
        return Response.json({ error: 'Already funded' }, { status: 429 });
      }

      // All faucet payments come from ONE account, so concurrent onboarding
      // races on the sequence number (tx_bad_seq). Rebuild with a fresh
      // sequence and retry with jitter instead of failing the user.
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) {
          await new Promise(r => setTimeout(r, 400 + Math.floor(Math.random() * 900)));
        }
        try {
          const faucetAccount = await server.loadAccount(faucetKeypair.publicKey());
          const tx = new TransactionBuilder(faucetAccount, {
            fee: '10000',
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
        } catch (err) {
          lastError = err;
          const codes = (err as {
            response?: { data?: { extras?: { result_codes?: { transaction?: string } } } };
          })?.response?.data?.extras?.result_codes;
          // Only sequence races are worth retrying; real failures surface at once.
          if (codes?.transaction !== 'tx_bad_seq') throw err;
        }
      }
      throw lastError;
    }

    return Response.json({ error: 'Unknown step' }, { status: 400 });
  } catch (e: unknown) {
    // Surface Horizon result codes (e.g. op_underfunded when the faucet is
    // out of USDC) instead of a generic axios message.
    const horizonCodes = (e as {
      response?: { data?: { extras?: { result_codes?: unknown } } };
    })?.response?.data?.extras?.result_codes;
    const msg = horizonCodes
      ? `Horizon: ${JSON.stringify(horizonCodes)}`
      : e instanceof Error
        ? e.message
        : 'Faucet failed';
    return Response.json({ error: msg }, { status: 500 });
  }
}
