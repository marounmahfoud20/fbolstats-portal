"use client";

export default function NationalCompetitionError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <h2 className="text-lg font-bold">Competitions are temporarily unavailable</h2>
      <p className="mt-2 text-sm">Please try loading this page again.</p>
      <button type="button" onClick={unstable_retry} className="mt-4 rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white">Try again</button>
    </div>
  );
}
