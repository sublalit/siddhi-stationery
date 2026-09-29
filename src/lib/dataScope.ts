import { cache } from 'react';
import prisma from '@/lib/prisma';
import { getSupabaseUser } from '@/lib/sessionApproval';

export const DEMO_EMAIL_DOMAIN = '@example.com';

export function isDemoEmail(email?: string | null) {
  return Boolean(email && email.trim().toLowerCase().endsWith(DEMO_EMAIL_DOMAIN));
}

export interface DataScope {
  isDemo: boolean;
  email: string | null;
}

/**
 * Resolves which dataset (demo or live) the current request may touch.
 * Derived only from the server-verified Supabase session, never from client input.
 * Requests without a session are treated as demo so they can never see live data.
 */
export const getDataScope = cache(async (): Promise<DataScope> => {
  const user = await getSupabaseUser().catch(() => null);
  if (!user) return { isDemo: true, email: null };

  const email = user.email ?? null;
  if (isDemoEmail(email)) return { isDemo: true, email };

  const record = await prisma.user
    .findFirst({
      where: {
        OR: [
          { supabaseAuthId: user.id },
          ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
        ],
      },
      select: { isDemo: true },
    })
    .catch(() => null);

  return { isDemo: Boolean(record?.isDemo), email };
});

export async function getScopeWhere() {
  const { isDemo } = await getDataScope();
  return { isDemo };
}
