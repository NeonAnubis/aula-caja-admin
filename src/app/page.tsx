import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Aula Caja Admin . Panel del director",
  description:
    "Panel de administración del POS escolar. Reportes globales, gestión de usuarios y configuración del sistema."
};

const POWERS = [
  {
    label: "Reportes globales",
    text: "Ventas, recargas, mezcla de pago y top productos por turno, día, semana o mes."
  },
  {
    label: "Gestión de usuarios",
    text: "Alta y baja de cajeros, promoción a administrador, control de sesión y accesos."
  },
  {
    label: "Cierres y conciliación",
    text: "Cierre de día con bloqueo de período. Conciliación bancaria y comparativa con caja chica."
  },
  {
    label: "Configuración del sistema",
    text: "Identidad fiscal, parámetros de impuestos, integraciones de pago y respaldos."
  }
];

export default function AdminLanding() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-ink-950 text-white">
      <div
        aria-hidden
        className="absolute -left-40 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-brand-700/40 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute -right-40 bottom-0 -z-10 h-[520px] w-[520px] rounded-full bg-brand-800/40 blur-[120px]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-dot-grid-dark opacity-30" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="flex items-center gap-2 text-sm font-bold tracking-tight">
            Aula <span className="text-brand-400">Caja</span>
            <span className="rounded-md border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-2xs uppercase tracking-widest text-white/70">
              admin
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href={process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000"}
            className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-flex"
          >
            ← Panel del cajero
          </a>
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full glass-frost px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em] text-white/75">
          <span className="h-2 w-2 rounded-full bg-brand-400" />
          Acceso exclusivo del personal directivo
        </span>

        <h1 className="mt-7 max-w-3xl text-balance text-5xl font-bold leading-[1.02] tracking-tightest sm:text-6xl md:text-7xl">
          El panel que ve<br />
          <span className="text-brand-400">toda la tienda escolar.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-white/75 sm:text-xl">
          Reportes globales, gestión de usuarios, conciliación bancaria,
          configuración del sistema. Una sola vista para entender qué pasó
          hoy en cada caja y cada turno.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Entrar al panel
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000"}
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            Soy cajero
          </a>
        </div>

        <ul className="mt-20 grid gap-3 sm:grid-cols-2">
          {POWERS.map((p) => (
            <li
              key={p.label}
              className="glass-frost rounded-2xl p-5 transition-colors hover:border-white/30"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                  {p.label}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{p.text}</p>
            </li>
          ))}
        </ul>

        <p className="mt-16 text-xs text-white/45">
          El primer usuario registrado en este panel se convierte
          automáticamente en administrador. A partir de ahí, los demás roles
          (cajero) deben ser promovidos desde Gestión de usuarios.
        </p>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-white/45 sm:flex-row">
          <p>(c) {new Date().getFullYear()} Aula Caja Admin · CDMX</p>
          <p className="font-mono">Acceso protegido . solo personal autorizado</p>
        </div>
      </footer>
    </main>
  );
}
