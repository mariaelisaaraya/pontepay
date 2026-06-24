import EarnCard from '@/components/EarnCard';

export default function EarnPage() {
  return (
    <div className="mx-auto w-full max-w-120 px-4 py-6">
      <h1 className="mb-1 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-gray-900">
        Earn
      </h1>
      <p className="mb-5 text-sm text-gray-500">
        Put your idle USDC to work — deposit into the DeFindex vault and earn yield on Stellar.
      </p>
      <EarnCard />
    </div>
  );
}
