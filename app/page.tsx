export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_20%_10%,#dbeafe_0%,transparent_60%),radial-gradient(800px_420px_at_90%_20%,#dcfce7_0%,transparent_58%),linear-gradient(to_bottom,#f8fbff,#eef4ff)]" />
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/85 p-10 text-center shadow-[0_18px_60px_rgb(15,23,42,0.12)] backdrop-blur">
        <div className="mx-auto mb-5 inline-flex rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">FbolStats Portal</div>
        <h1 className="mb-3 text-5xl font-bold tracking-tight text-slate-900">Modern Football Operations</h1>
        <p className="text-lg text-slate-600">Your competitions, matches, lineups, and player data in one fast admin workspace.</p>
      </div>
    </main>
  )
}
