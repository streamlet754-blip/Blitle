import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const code = typeof searchParams?.code === 'string' ? searchParams.code : null;
  const next = typeof searchParams?.next === 'string' && searchParams.next ? searchParams.next : '/';

  if (!code) {
    redirect('/login');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect('/login');
  }

  redirect(next);
}
