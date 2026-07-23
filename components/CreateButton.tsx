'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function CreateButton({ loggedIn }: { loggedIn: boolean }) {
  return loggedIn ? (
    <motion.button
      type="button"
      onClick={() => document.getElementById('create-blitle')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
      whileHover={{ scale: 1.08, rotate: 3 }}
      whileTap={{ scale: 0.94 }}
      aria-label="Create a Blitle"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 text-3xl font-light text-slate-950 shadow-xl shadow-sky-500/30"
    >
      +
    </motion.button>
  ) : (
    <motion.div whileHover={{ scale: 1.08, rotate: 3 }} whileTap={{ scale: 0.94 }} className="fixed bottom-6 right-6 z-40">
      <Link
        href="/login"
        aria-label="Log in to create a Blitle"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 text-3xl font-light text-slate-950 shadow-xl shadow-sky-500/30"
      >
        +
      </Link>
    </motion.div>
  );
}
