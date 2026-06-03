import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mxn, dateShort } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compras . Aula Caja" };

export default async function ComprasPage() {
  const [suppliers, orders, openCount] = await Promise.all([
    prisma.supplier.findMany({
      where: { active: true },
      orderBy: { legalName: "asc" }
    }),
    prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        supplier: { select: { legalName: true } },
        items: { select: { id: true } }
      }
    }),
    prisma.purchaseOrder.count({
      where: { status: { in: ["PENDING", "IN_TRANSIT"] } }
    })
  ]);

  return (
    <div className="px-6 py-8 md:px-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Compras
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
          Proveedores y órdenes
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {suppliers.length} proveedores activos · {openCount} órdenes abiertas.
          La creación de OC es la siguiente entrega; este panel ya consume las
          tablas en producción.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-ink-900">Proveedores</h2>
          {suppliers.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">
              Sin proveedores aún.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {suppliers.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-ink-100 px-3 py-2.5"
                >
                  <div className="text-sm font-semibold text-ink-900">
                    {s.legalName}
                  </div>
                  <div className="font-mono text-2xs text-ink-500">
                    RFC {s.rfc}
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    {s.contactName ?? "—"} · {s.phone ?? "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          <h2 className="border-b border-ink-100 px-5 py-4 text-base font-semibold text-ink-900">
            Órdenes de compra recientes
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-ink-50/50 text-2xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Folio</th>
                <th className="px-4 py-3 text-left font-semibold">Proveedor</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-center font-semibold">Items</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-left font-semibold">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-400">
                    Aún no hay órdenes registradas.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">
                    {o.folio}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{o.supplier.legalName}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-2xs text-ink-700">
                      {o.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-ink-500">
                    {o.items.length}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-ink-900">
                    {mxn(o.totalCents)}
                  </td>
                  <td className="px-4 py-3 font-mono text-2xs text-ink-400">
                    {dateShort(o.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
