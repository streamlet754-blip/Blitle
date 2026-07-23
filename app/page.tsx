import Link from 'next/link';
import { CreateBlitle } from '@/components/CreateBlitle';
import { CreateButton } from '@/components/CreateButton';
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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-14 flex items-center justify-between border-b border-slate-800/70 pb-5">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">Blitle<span className="text-sky-400">.</span></Link>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="hidden sm:inline">Ideas in motion</span>
          {!user ? <Link href="/login" className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300 transition hover:border-sky-400 hover:text-white">Log in</Link> : <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-emerald-300">Live feed</span>}
        </div>
      </header>

      <section className="relative mb-12 overflow-hidden pb-2">
        <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">The short-form canvas</p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">Make the small idea <span className="text-sky-300">matter.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">Drop a thought, a picture, or a little code. Keep it under 60 words and let the good stuff travel.</p>
          <div className="mt-7 flex items-center gap-6 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span><strong className="text-white">60</strong> words max</span>
            <span className="h-1 w-1 rounded-full bg-sky-400" />
            <span>Text · image · code</span>
          </div>
        </div>
      </section>

      {!user ? (
        <section className="mb-8 rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Login to post your first Blitle</h2>
          <p className="mt-2 text-sm text-slate-400">Magic links make it quick and frictionless.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110">
            Go to login
          </Link>
        </section>
      ) : (
        <>
          <CreateBlitle />
          <div className="mb-4 mt-14 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Community drops</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Fresh from the feed</h2>
            </div>
            <span className="text-xs text-slate-500">{blitles.length} {blitles.length === 1 ? 'drop' : 'drops'}</span>
          </div>
          <div className="space-y-4">
            {blitles.length > 0 ? (
              blitles.map((blitle) => (
                <article key={blitle.id} className="group rounded-[24px] border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[0_22px_60px_rgba(14,165,233,0.12)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{blitle.author.username ?? blitle.author.email}</p>
                      <p className="text-xs text-slate-500">{new Date(blitle.created_at).toLocaleString()}</p>
                    </div>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-400">{blitle.likes_count} likes</span>
                  </div>
                  <p className="whitespace-pre-wrap text-base leading-7 text-slate-200">{blitle.content}</p>
                  {blitle.image_url ? <img src={blitle.image_url} alt="Blitle attachment" className="mt-5 h-64 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-[1.01]" /> : null}
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
      <CreateButton loggedIn={Boolean(user)} />
    </main>
  );
}
