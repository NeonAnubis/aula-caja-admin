"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import {
  Layout, Zap, User, Shield, Sparkles, LogOut, Mail
} from "@/components/ui/icons";

type NavItem = {
  href: string;
  label: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
};

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Vista general",
    items: [
      { href: "/dashboard",   label: "Inicio",    Icon: Layout }
    ]
  },
  {
    group: "Equipo",
    items: [
      { href: "/usuarios",    label: "Usuarios",    Icon: Shield },
      { href: "/estudiantes", label: "Estudiantes", Icon: User }
    ]
  },
  {
    group: "Operación",
    items: [
      { href: "/pos",         label: "Cobro POS",   Icon: Zap },
      { href: "/inventario",  label: "Inventario",  Icon: Layout },
      { href: "/recargas",    label: "Recargas",    Icon: Sparkles },
      { href: "/compras",     label: "Compras",     Icon: Shield }
    ]
  },
  {
    group: "Finanzas",
    items: [
      { href: "/tesoreria",   label: "Tesorería",   Icon: Mail },
      { href: "/ventas",      label: "Ventas",      Icon: Layout }
    ]
  }
];

function AdminLogo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-ink-900">
        Aula <span className="text-brand-600">Caja</span>
        <span className="rounded-md border border-ink-200 bg-ink-100 px-1.5 py-0.5 font-mono text-2xs uppercase tracking-widest text-ink-600">
          admin
        </span>
      </span>
    </span>
  );
}

export function Sidebar({
  user
}: {
  user: { fullName: string | null; email: string; role: string };
}) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-100 bg-white px-4 py-5 md:flex">
      <Link href="/dashboard" className="px-2"><AdminLogo /></Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="px-2 pb-1 pt-3 text-2xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              {g.group}
            </div>
            {g.items.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-brand-600" : "opacity-70 group-hover:opacity-100"
                    )}
                  />
                  {label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rounded-2xl border border-ink-100 bg-ink-50 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 font-mono text-xs font-bold text-white">
            {initials(user.fullName, user.email)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink-900">
              {user.fullName ?? user.email}
            </div>
            <div className="truncate text-2xs font-mono uppercase tracking-wider text-brand-700">
              {user.role.toLowerCase()}
            </div>
          </div>
        </div>
        <form action="/api/auth/signout" method="post" className="mt-3">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition-colors hover:bg-ink-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
