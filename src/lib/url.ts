import "server-only";
import { headers } from "next/headers";

/**
 * Resolve the public origin (scheme + host) the current request arrived on.
 *
 * Precedence:
 *   1. The incoming request host (x-forwarded-host → host). This is ground
 *      truth for "where the user actually is" and is exactly what an auth
 *      email-confirmation redirect needs. It works on Vercel production,
 *      preview deployments and localhost with ZERO configuration, so the
 *      confirmation link always points back to the same deployment the user
 *      signed up on.
 *   2. NEXT_PUBLIC_APP_URL — explicit canonical override, used when there is
 *      no request context (rare). Set this in Vercel if you want every email
 *      to use one fixed domain regardless of which URL the user hit.
 *   3. VERCEL_URL — the per-deployment URL Vercel injects at runtime.
 *   4. http://localhost:3000 — local-dev fallback.
 *
 * Server-only: it reads request headers, so never import it into a client
 * component (that would throw at build time).
 */
export function getRequestOrigin(): string {
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const isLocal =
        host.startsWith("localhost") || host.startsWith("127.0.0.1");
      const proto =
        h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() throws when called outside a request scope — fall through.
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
