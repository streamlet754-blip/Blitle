'use client';

import { useEffect, useState } from 'react';

const COOKIE_KEY = 'blitle-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(COOKIE_KEY) !== 'accepted');
  }, []);

  if (!visible) return null;

  return (
    <aside className="fixed bottom-4 left-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-700/80 bg-slate-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <p className="text-sm font-medium text-white">A small cookie, a smoother Blitle.</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">We use essential browser storage to remember your preferences and keep sign-in working.</p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(COOKIE_KEY, 'accepted');
          setVisible(false);
        }}
        className="mt-3 rounded-full bg-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Got it
      </button>
    </aside>
  );
}
