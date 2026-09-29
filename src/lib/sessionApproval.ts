import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import prisma from '@/lib/prisma';

export async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Middleware already refreshes the session cookie.
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSessionApproval() {
  const user = await getSupabaseUser();
  if (!user) return { user: null, isApproved: false };

  const record = await prisma.user.findFirst({
    where: {
      OR: [
        { supabaseAuthId: user.id },
        ...(user.email
          ? [{ email: { equals: user.email, mode: 'insensitive' as const } }]
          : []),
      ],
    },
    select: { isApproved: true },
  });

  return { user, isApproved: Boolean(record?.isApproved) };
}
