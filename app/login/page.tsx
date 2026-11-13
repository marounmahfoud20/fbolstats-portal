export const metadata = { title: "Sign In" };

import LoginForm from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_20%_10%,#dbeafe_0%,transparent_60%),radial-gradient(800px_420px_at_90%_20%,#dcfce7_0%,transparent_58%),linear-gradient(to_bottom,#f8fbff,#eef4ff)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_24px_80px_rgb(15,23,42,0.16)] backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between bg-[#092553] p-12 text-white md:flex">
          <div className="text-sm font-bold uppercase tracking-[0.22em] text-blue-200">FbolStats Portal</div>
          <div>
            <div className="mb-5 h-1 w-14 rounded-full bg-emerald-400" />
            <h1 className="max-w-md text-4xl font-bold leading-tight">Your football data, all in one place.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/75">Sign in to continue to your competitions, matches, and statistics workspace.</p>
          </div>
          <p className="text-xs text-blue-200/60">A private workspace for FbolStats members</p>
        </section>
        <section className="p-7 sm:p-10 md:p-12">
          <div className="mb-10 md:hidden text-sm font-bold uppercase tracking-[0.2em] text-blue-800">FbolStats Portal</div>
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Member access</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Enter your account details to sign in.</p>
          </div>
          <LoginForm destination={destination} />
          <p className="mt-8 text-center text-xs text-slate-400">Accounts are provided by the workspace administrator.</p>
        </section>
      </div>
    </main>
  );
}
