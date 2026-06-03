import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Server-side Supabase client. Use inside server components, server actions
 * and route handlers. Cookies are read/written through Next's cookies() API.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Calling setAll from a Server Component is a no-op when there is
            // a middleware refreshing the session . that's fine.
          }
        }
      }
    }
  );
}

/**
 * Service-role client. Bypasses RLS . NEVER expose to the browser.
 * Use only in trusted server routes (admin tasks, webhooks).
 */
export async function createServiceClient() {
  // Lazy import keeps the bundle clean for the normal request path.
  // This is the standard supabase-js client (no cookies needed) and bypasses RLS.
  const { createClient: createPlain } = await import("@supabase/supabase-js");
  return createPlain(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
