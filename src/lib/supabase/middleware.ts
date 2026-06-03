import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Refresh the auth session on each request and gate /dashboard behind login.
 * Patterns adapted from the Supabase Next.js Server-Side Auth recipe.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // Touch getUser() to trigger the refresh; the new tokens are written to
  // the response cookies above.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isAuthPage =
    url.pathname === "/login" ||
    url.pathname === "/register" ||
    url.pathname.startsWith("/auth");
  const PROTECTED_PREFIXES = [
    "/dashboard", "/pos", "/estudiantes", "/inventario",
    "/recargas", "/compras", "/tesoreria", "/ventas", "/usuarios"
  ];
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => url.pathname === p || url.pathname.startsWith(p + "/")
  );

  if (!user && isProtected) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", url.pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthPage && url.pathname !== "/auth/callback") {
    const redirect = url.clone();
    redirect.pathname = "/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
