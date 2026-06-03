import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./form";

export const metadata: Metadata = {
  title: "Iniciar sesión . Aula Caja Admin",
  description: "Accede al panel de administración."
};

function Wordmark({ tone = "ink" }: { tone?: "ink" | "white" }) {
  return (
    <Link
      href="/"
      className={
        "inline-flex w-fit items-center gap-2.5 text-sm font-bold tracking-tight " +
        (tone === "white" ? "text-white" : "text-ink-900")
      }
    >
      <span
        className={
          "grid h-9 w-9 place-items-center rounded-xl text-white " +
          (tone === "white" ? "bg-brand-600" : "bg-ink-900")
        }
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="flex items-center gap-2">
        Aula <span className={tone === "white" ? "text-brand-400" : "text-brand-600"}>Caja</span>
        <span
          className={
            "rounded-md border px-1.5 py-0.5 font-mono text-2xs uppercase tracking-widest " +
            (tone === "white"
              ? "border-white/20 bg-white/5 text-white/70"
              : "border-ink-200 bg-ink-100 text-ink-600")
          }
        >
          admin
        </span>
      </span>
    </Link>
  );
}

export default function LoginPage({
  searchParams
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next ?? "/dashboard";

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[2fr_1fr]">
      {/* =========================  LEFT  ·  IMAGE 2/3  ========================= */}
      <aside className="relative isolate hidden overflow-hidden bg-ink-950 text-white lg:block">
        <img
          src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=2400&q=85&auto=format&fit=crop"
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-dot-grid-dark opacity-30" aria-hidden />

        {/* Brand top-left */}
        <div className="absolute left-12 top-12">
          <Wordmark tone="white" />
        </div>

        {/* Privileged-access badge top-right */}
        <span className="absolute right-12 top-12 inline-flex items-center gap-2 rounded-full glass-frost px-3 py-1.5 text-2xs font-mono uppercase tracking-[0.18em] text-white/85">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 animate-pulse rounded-full bg-brand-400" />
            <span className="relative h-2 w-2 rounded-full bg-brand-400" />
          </span>
          Acceso privilegiado
        </span>

        {/* Director testimonial bottom-left */}
        <figure className="absolute bottom-12 left-12 right-12 max-w-xl">
          <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-8 backdrop-blur-2xl">
            <p className="font-mono text-2xs uppercase tracking-[0.22em] text-brand-300">
              panel del director
            </p>
            <blockquote className="mt-5 text-balance text-2xl font-semibold leading-[1.25] tracking-tight text-white sm:text-3xl">
              &ldquo;El cierre del mes pasa de tres días en hojas de cálculo a un
              solo click. Aprendí más sobre nuestra tienda escolar en una semana
              que en los últimos dos años.&rdquo;
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-900 font-mono text-xs font-bold text-white">
                DG
              </span>
              <div className="text-sm text-white/75">
                <div className="font-semibold text-white">Director General</div>
                <div className="font-mono text-2xs uppercase tracking-widest text-white/55">
                  Colegio Vértice · CDMX · 1,800 alumnos
                </div>
              </div>
            </figcaption>
          </div>
        </figure>
      </aside>

      {/* =========================  RIGHT  ·  FORM 1/3  ========================= */}
      <section className="flex min-h-screen flex-col bg-white px-6 py-8 sm:px-10">
        {/* Brand visible on mobile only */}
        <div className="lg:hidden">
          <Wordmark />
        </div>

        <div className="my-auto py-10">
          <header className="max-w-md">
            <p className="text-2xs font-mono uppercase tracking-[0.20em] text-brand-600">
              acceso de administrador
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tighter2 text-ink-900 sm:text-[2.5rem]">
              Inicia sesión.
            </h1>
            <p className="mt-3 max-w-sm text-base text-ink-500">
              Acceso exclusivo para administradores. Si eres cajero, ingresa
              desde el panel de operación.
            </p>
          </header>

          <div className="mt-9 max-w-md">
            <LoginForm next={next} />
          </div>

          <p className="mt-8 max-w-md text-sm text-ink-500">
            ¿Aún no tienes cuenta?{" "}
            <Link
              href={`/register?next=${encodeURIComponent(next)}`}
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Solicita acceso
            </Link>
          </p>
        </div>

        <p className="max-w-md text-xs text-ink-400">
          Acceso protegido . solo personal autorizado .{" "}
          <a
            href={process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000"}
            className="font-semibold text-ink-700 underline-offset-2 hover:underline"
          >
            Soy cajero
          </a>
        </p>
      </section>
    </main>
  );
}
