import AnchorCard from '@/components/AnchorCard';

export default function AnchorPage() {
  return (
    <div className="mx-auto w-full max-w-120 px-4 py-6">
      <h1 className="mb-1 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-gray-900">
        Fiat ramp
      </h1>
      <p className="mb-5 text-sm text-gray-500">
        Move between USDC on Stellar and local fiat through a SEP-24 anchor.
      </p>
      <AnchorCard />
    </div>
  );
}
