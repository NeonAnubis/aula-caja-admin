import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateShort } from "@/lib/format";
import { initials } from "@/lib/utils";
import { UserRow } from "./user-row";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Usuarios . Aula Caja Admin" };

export default async function UsersPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  // Only admins land here
  const session = await requireRole(["ADMIN"]);

  const q = (searchParams.q ?? "").trim();

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { fullName: { contains: q, mode: "insensitive" as const } }
        ]
      }
    : undefined;

  const profiles = await prisma.profile.findMany({
    where,
    orderBy: [{ role: "asc" }, { fullName: "asc" }, { email: "asc" }]
  });

  const counts = {
    total: profiles.length,
    admin: profiles.filter((p) => p.role === "ADMIN").length,
    cashier: profiles.filter((p) => p.role === "CASHIER").length,
    parent: profiles.filter((p) => p.role === "PARENT").length,
    inactive: profiles.filter((p) => !p.active).length
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Gestión de usuarios
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
            Equipo y permisos
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {counts.total} cuentas registradas . {counts.admin} administradores
            . {counts.cashier} cajeros{counts.parent ? ` . ${counts.parent} tutores` : ""}
            {counts.inactive ? ` . ${counts.inactive} inactivas` : ""}
          </p>
        </div>
        <form action="/usuarios" method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email…"
            className="h-12 w-72 rounded-2xl border-2 border-ink-100 bg-ink-50/70 px-4 text-sm font-medium text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-500 focus:bg-white"
          />
          <button
            type="submit"
            className="h-12 rounded-2xl border-2 border-ink-200 bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-50"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/60 text-2xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Usuario</th>
              <th className="px-4 py-3 text-left font-semibold">Rol</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-left font-semibold">Alta</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {profiles.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-ink-400"
                >
                  {q
                    ? "No se encontró ningún usuario con esos criterios."
                    : "Aún no hay otros usuarios. Comparte el enlace de registro del panel cajero o registra cuentas adicionales."}
                </td>
              </tr>
            )}
            {profiles.map((p) => (
              <UserRow
                key={p.id}
                user={{
                  id: p.id,
                  email: p.email,
                  fullName: p.fullName,
                  role: p.role,
                  active: p.active,
                  createdAt: p.createdAt.toISOString()
                }}
                isMe={p.id === session.userId}
                initials={initials(p.fullName, p.email)}
                createdLabel={dateShort(p.createdAt)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/50 p-5 text-sm text-ink-600">
        <strong className="text-ink-900">Reglas de seguridad.</strong> Nunca
        podrás dejar el sistema sin administradores activos; siempre debe
        existir al menos una cuenta con rol ADMIN. Tampoco puedes desactivarte,
        eliminarte ni quitarte el rol ADMIN a ti mismo. Para todos esos casos
        pide a otro administrador que lo haga.
      </div>
    </div>
  );
}
