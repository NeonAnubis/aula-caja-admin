import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "./form";

export const metadata: Metadata = {
  title: "Solicitar acceso . Aula Caja Admin",
  description: "Crea tu cuenta de administrador."
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

const POWERS = [
  ["Reportes globales",        "Ventas, recargas y mezcla de pago por turno, día, semana o mes."],
  ["Gestión del equipo",       "Alta y baja de cajeros, promoción a administrador, control de accesos."],
  ["Cierres y conciliación",   "Cierre de día con bloqueo de período y comparativa con caja chica."]
];

export default function RegisterPage() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[2fr_1fr]">
      {/* =========================  LEFT  ·  IMAGE 2/3  ========================= */}
      <aside className="relative isolate hidden overflow-hidden bg-ink-950 text-white lg:block">
        <img
          src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=2400&q=85&auto=format&fit=crop"
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

        {/* Badge top-right */}
        <span className="absolute right-12 top-12 inline-flex items-center gap-2 rounded-full glass-frost px-3 py-1.5 text-2xs font-mono uppercase tracking-[0.18em] text-white/85">
          solicitud de acceso
        </span>

        {/* Powers list bottom */}
        <div className="absolute bottom-12 left-12 right-12 max-w-2xl">
          <p className="font-mono text-2xs uppercase tracking-[0.22em] text-brand-300">
            lo que ves desde el panel
          </p>
          <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl">
            Toda la tienda escolar, en una sola vista.
          </h2>

          <ul className="mt-9 flex flex-col gap-3">
            {POWERS.map(([t, b]) => (
              <li
                key={t}
                className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.05] p-4 backdrop-blur-xl"
              >
                <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-lg bg-brand-600 text-white">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                    <path d="m5 12 5 5 9-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{t}</div>
                  <div className="mt-0.5 text-xs leading-snug text-white/70">{b}</div>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 font-mono text-2xs uppercase tracking-widest text-white/45">
            primer usuario registrado = administrador automático
          </p>
        </div>
      </aside>

      {/* =========================  RIGHT  ·  FORM 1/3  ========================= */}
      <section className="flex min-h-screen flex-col bg-white px-6 py-8 sm:px-10">
        <div className="lg:hidden">
          <Wordmark />
        </div>

        <div className="my-auto py-10">
          <header className="max-w-md">
            <p className="text-2xs font-mono uppercase tracking-[0.20em] text-brand-600">
              solicitar acceso de administrador
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tighter2 text-ink-900 sm:text-[2.5rem]">
              Crea tu cuenta admin.
            </h1>
            <p className="mt-3 max-w-sm text-base text-ink-500">
              El primer usuario en este panel se convierte en administrador
              automáticamente. Los siguientes deben ser promovidos por un
              admin existente.
            </p>
          </header>

          <div className="mt-9 max-w-md">
            <RegisterForm />
          </div>

          <p className="mt-8 max-w-md text-sm text-ink-500">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Inicia sesión
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
