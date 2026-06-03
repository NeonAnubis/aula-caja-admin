import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verificación del sistema" };

type Check = {
  label: string;
  ok: boolean;
  detail: string;
  hint?: string;
};

async function runChecks(): Promise<{
  checks: Check[];
  env: { url?: string; appUrl?: string };
}> {
  const checks: Check[] = [];

  // ---- 1. env vars ----
  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "DATABASE_URL",
    "DIRECT_URL",
    "SERVICE_ROLE_KEY"
  ] as const;
  const missingEnv = requiredEnv.filter((k) => !process.env[k]);
  checks.push({
    label: "Variables de entorno",
    ok: missingEnv.length === 0,
    detail:
      missingEnv.length === 0
        ? `${requiredEnv.length} variables cargadas correctamente`
        : `Faltan: ${missingEnv.join(", ")}`,
    hint: "Definir en .env.local"
  });

  // ---- 2. Supabase Auth health ----
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const r = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      cache: "no-store"
    });
    const j = (await r.json().catch(() => ({}))) as {
      version?: string;
      name?: string;
      description?: string;
    };
    checks.push({
      label: "Supabase Auth API",
      ok: r.ok,
      detail: r.ok
        ? `${j.name ?? "GoTrue"} ${j.version ?? ""} . status ${r.status}`
        : `HTTP ${r.status}`
    });
  } catch (e: any) {
    checks.push({
      label: "Supabase Auth API",
      ok: false,
      detail: `Error de red: ${e.message}`
    });
  }

  // ---- 3. Postgres via Prisma ----
  try {
    const t0 = Date.now();
    const r = (await prisma.$queryRaw`select 1 as ok`) as Array<{ ok: number }>;
    const dt = Date.now() - t0;
    checks.push({
      label: "Postgres . pooler transaction-mode",
      ok: r?.[0]?.ok === 1,
      detail: `select 1 → ${r?.[0]?.ok} . latencia ${dt} ms`
    });
  } catch (e: any) {
    checks.push({
      label: "Postgres . pooler transaction-mode",
      ok: false,
      detail: `Error: ${e.message}`
    });
  }

  // ---- 4. Prisma schema present ----
  try {
    const [profiles, products, students, suppliers] = await Promise.all([
      prisma.profile.count(),
      prisma.product.count(),
      prisma.student.count(),
      prisma.supplier.count()
    ]);
    checks.push({
      label: "Esquema Prisma desplegado",
      ok: true,
      detail: `profiles=${profiles} . products=${products} . students=${students} . suppliers=${suppliers}`
    });
  } catch (e: any) {
    checks.push({
      label: "Esquema Prisma desplegado",
      ok: false,
      detail: `Error: ${e.message}`,
      hint: "Ejecuta `npm run db:push` y luego `npm run db:seed`"
    });
  }

  // ---- 5. Trigger + RPC functions present (via service client) ----
  try {
    const svc = await createServiceClient();
    const { data, error } = await svc
      .from("information_schema.routines" as any)
      .select("routine_name")
      .eq("routine_schema", "public")
      .in("routine_name", [
        "handle_new_user",
        "handle_user_update",
        "current_user_role",
        "record_sale",
        "record_recharge"
      ]);
    const found = (data ?? []).map((r: any) => r.routine_name as string);
    const expected = [
      "handle_new_user",
      "handle_user_update",
      "current_user_role",
      "record_sale",
      "record_recharge"
    ];
    const missing = expected.filter((x) => !found.includes(x));
    checks.push({
      label: "Triggers + funciones RPC instalados",
      ok: missing.length === 0 && !error,
      detail:
        missing.length === 0
          ? `${found.length}/${expected.length} funciones disponibles`
          : `Faltan: ${missing.join(", ")}`,
      hint:
        missing.length > 0
          ? "Ejecuta `npm run db:init` para aplicar prisma/init.sql"
          : undefined
    });
  } catch (e: any) {
    checks.push({
      label: "Triggers + funciones RPC instalados",
      ok: false,
      detail: `Error: ${e.message}`
    });
  }

  // ---- 6. Service-role client (server-only) ----
  try {
    const svc = await createServiceClient();
    const { data, error } = await svc.auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.push({
      label: "Service-role key válida (admin API)",
      ok: !error,
      detail: error
        ? `Error: ${error.message}`
        : `Listado correcto . ${data?.users?.length ?? 0} usuario(s) inspeccionado(s)`
    });
  } catch (e: any) {
    checks.push({
      label: "Service-role key válida (admin API)",
      ok: false,
      detail: `Error: ${e.message}`
    });
  }

  // ---- 7. Session from cookies (no-op when not logged in, but proves SSR works) ----
  try {
    const ssr = createClient();
    const { data, error } = await ssr.auth.getSession();
    const hasSession = !!data.session;
    checks.push({
      label: "Cookies SSR de sesión",
      ok: !error,
      detail: hasSession
        ? `Sesión activa para ${data.session!.user.email}`
        : "No hay sesión iniciada . el helper respondió OK"
    });
  } catch (e: any) {
    checks.push({
      label: "Cookies SSR de sesión",
      ok: false,
      detail: `Error: ${e.message}`
    });
  }

  return {
    checks,
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    }
  };
}

export default async function SetupPage() {
  const { checks, env } = await runChecks();
  const allOk = checks.every((c) => c.ok);
  const okCount = checks.filter((c) => c.ok).length;

  return (
    <main className="min-h-screen bg-ink-50/30 py-12">
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand-600">
              Aula Caja . sistema
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">
              Verificación del sistema
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Esta página corre 7 comprobaciones del lado del servidor para
              confirmar que la base de datos, la autenticación y los permisos
              están listos antes de operar.
            </p>
          </div>
          <span
            className={
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold " +
              (allOk
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700")
            }
          >
            <span
              className={
                "h-2 w-2 rounded-full " +
                (allOk ? "bg-emerald-500" : "bg-amber-500")
              }
            />
            {okCount} / {checks.length} OK
          </span>
        </div>

        <ol className="mt-8 space-y-3">
          {checks.map((c, i) => (
            <li
              key={i}
              className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className={
                      "mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg text-sm font-bold text-white " +
                      (c.ok ? "bg-emerald-500" : "bg-amber-500")
                    }
                    aria-hidden
                  >
                    {c.ok ? "✓" : "!"}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-ink-900">
                      {c.label}
                    </h3>
                    <p className="mt-1 font-mono text-xs leading-relaxed text-ink-500">
                      {c.detail}
                    </p>
                    {c.hint && !c.ok && (
                      <p className="mt-2 text-xs text-amber-700">→ {c.hint}</p>
                    )}
                  </div>
                </div>
                <span className="font-mono text-2xs text-ink-300">{String(i + 1).padStart(2, "0")}</span>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-ink-900">Entorno</h3>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-400">SUPABASE_URL</dt>
              <dd className="font-mono text-ink-700">{env.url ?? "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-400">APP_URL</dt>
              <dd className="font-mono text-ink-700">{env.appUrl ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-8 flex justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-ink-700 hover:text-ink-900"
          >
            ← Volver al inicio
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Crear primer usuario admin →
          </Link>
        </div>
      </div>
    </main>
  );
}
