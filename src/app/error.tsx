'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <p className="text-red-400 text-base font-medium">Algo salió mal.</p>
      <button onClick={reset} className="text-purple-400 underline text-sm">
        Reintentar
      </button>
    </div>
  );
}
