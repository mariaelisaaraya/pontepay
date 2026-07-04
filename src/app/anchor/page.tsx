import AnchorCard from '@/components/AnchorCard';

export default function AnchorPage() {
  return (
    <div className="mx-auto w-full max-w-120 px-4 py-6">
      <h1 className="mb-1 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-gray-900">
        Fiat ramp
      </h1>
      <p className="mb-3 text-sm text-gray-500">
        Prefer a company instead of P2P? An <strong>anchor</strong> is a
        regulated business that connects your bank to Stellar: you send them
        local currency and they credit USDC to your wallet (deposit), or the
        reverse (withdraw).
      </p>
      <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Testnet uses Stellar&apos;s test anchor (testanchor.stellar.org) with
        play money. In production this would be a licensed local anchor — e.g.
        Anclap in Argentina — moving real pesos.
      </p>
      <AnchorCard />
    </div>
  );
}
