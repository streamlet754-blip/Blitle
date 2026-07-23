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

    const siteUrl = process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://blitle.vercel.app');
    const redirectTo = `${siteUrl}/auth/callback`;

    try {
      const supabase = createClient();
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

      setMessage('Check your email for the magic link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send the magic link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_45%),linear-gradient(135deg,_#020617_0%,_#0f172a_50%,_#111827_100%)] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [0, -2, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-sky-500/20 blur-2xl"
        />
        <motion.div
          animate={{ y: [0, 8, 0], x: [0, 5, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-2xl"
        />

        <div className="relative z-10 text-center">
          <div className="mb-5 inline-flex items-center rounded-full border border-slate-700/70 bg-slate-950/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400">
            Blitle
          </div>
          <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Drop in with a magic link and get straight to sharing.</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 mt-7 space-y-4">
          <label className="block text-left text-sm text-slate-400">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-2 w-full rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.01, y: -1 } : undefined}
            whileTap={!loading ? { scale: 0.99 } : undefined}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </motion.button>
        </form>

        <div className="relative z-10 mt-5 min-h-[3rem] text-center text-sm">
          {message ? (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-emerald-400">
              {message}
            </motion.p>
          ) : null}
          {error ? (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-rose-400">
              {error}
            </motion.p>
          ) : null}
        </div>
      </motion.div>
    </main>
  );
}
