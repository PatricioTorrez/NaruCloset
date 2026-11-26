import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Refresca la sesión de Supabase y hace una verificación optimista de /admin.
 * No es la barrera de seguridad: el layout del panel, las Server Actions, las funciones
 * RPC y RLS verifican el rol por su cuenta (docs/SECURITY.md §2).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isLogin = request.nextUrl.pathname === '/admin/login';

  if (!data?.claims && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
