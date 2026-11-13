'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ destination }: { destination: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.get('username'), password: formData.get('password') }),
      });
      if (!response.ok) {
        setError(response.status === 500 ? 'Sign in is temporarily unavailable. Please try again.' : 'The username or password is incorrect.');
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">Username</label>
        <input id="username" name="username" autoComplete="username" required className="w-full rounded-xl px-4 py-3 text-sm" placeholder="Your username" />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full rounded-xl px-4 py-3 text-sm" placeholder="Your password" />
      </div>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button disabled={pending} className="w-full rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
