import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set([
  '/login',
  '/register',
  '/auth',
  '/pending',
  '/forgot-password',
  '/update-password',
]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Session cookie only. Do not query Prisma here — this file runs on the Edge.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const proxy = middleware;
export default middleware;

export const config = {
  matcher: [
    /*
     * Skip API routes, Next assets, and the public auth pages so
     * /login, /register, /auth, /pending, /forgot-password, and /update-password
     * cannot redirect to themselves.
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|login|register|auth|pending|forgot-password|update-password|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
