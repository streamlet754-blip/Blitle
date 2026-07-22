import Link from 'next/link';
import { CreateBlitle } from '@/components/CreateBlitle';
import { createClient } from '@/lib/supabase/server';
import { hasDatabaseUrl, prisma } from '@/lib/prisma';

export default async function HomePage() {
  let user = null;
  let blitles: Array<{
    id: string;
    content: string;
    image_url: string | null;
    code_snippet: string | null;
    language: string | null;
    likes_count: number;
    created_at: Date;
    author: {
      id: string;
      username: string | null;
      email: string;
      avatar_url: string | null;
    };
  }> = [];

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  if (hasDatabaseUrl()) {
    try {
      blitles = await prisma.blitle.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      });
    } catch {
      blitles = [];
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
      <div className="mb-8 rounded-[28px] border border-slate-800/80 bg-slate-900/70 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p className="mb-2 text-sm uppercase tracking-[0.3em] text-slate-400">Blitle</p>
        <h1 className="text-4xl font-semibold text-white">Share short ideas, images, and code</h1>
        <p className="mt-3 text-slate-400">A clean, fast, and free-tier social experience.</p>
      </div>

      {!user ? (
        <div className="mb-8 rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Login to post your first Blitle</h2>
          <p className="mt-2 text-sm text-slate-400">Magic links make it quick and frictionless.</p>
          <Link href="/login" className="mt-4 inline-flex rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110">
            Go to login
          </Link>
        </div>
      ) : (
        <>
          <CreateBlitle />
          <div className="mt-8 space-y-4">
            {blitles.length > 0 ? (
              blitles.map((blitle) => (
                <article key={blitle.id} className="rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{blitle.author.username ?? blitle.author.email}</p>
                      <p className="text-xs text-slate-500">{new Date(blitle.created_at).toLocaleString()}</p>
                    </div>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-400">{blitle.likes_count} likes</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{blitle.content}</p>
                  {blitle.image_url ? <img src={blitle.image_url} alt="Blitle attachment" className="mt-4 h-56 w-full rounded-2xl object-cover" /> : null}
                  {blitle.code_snippet ? (
                    <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 font-mono text-xs text-slate-300">
                      <code>{blitle.code_snippet}</code>
                    </pre>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-6 text-center text-sm text-slate-400 shadow-[0_16px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                No posts yet. Create the first one.
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
