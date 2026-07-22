'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'https://blitle.vercel.app/auth/callback';

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setError(error.message || 'Unable to send login link.');
        return;
      }

      setMessage('Check your email!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send the magic link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/40"
      >
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Blitle</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Login with magic link</h1>
          <p className="mt-2 text-sm text-slate-400">No password needed.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-0 focus:border-sky-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message ? <p className="mt-4 text-center text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-4 text-center text-sm text-rose-400">{error}</p> : null}
      </motion.div>
    </main>
  );
}
