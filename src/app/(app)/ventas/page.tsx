import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mxn, dateTimeShort } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ventas . Aula Caja" };

export default async function SalesPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [todayAgg, weekAgg, totalAgg, byMethod, recent, topProducts] =
    await Promise.all([
      prisma.sale.aggregate({
        _sum: { totalCents: true },
        _count: { _all: true },
        where: { createdAt: { gte: todayStart }, status: "COMPLETED" }
      }),
      prisma.sale.aggregate({
        _sum: { totalCents: true },
        _count: { _all: true },
        where: { createdAt: { gte: weekStart }, status: "COMPLETED" }
      }),
      prisma.sale.aggregate({
        _sum: { totalCents: true },
        _count: { _all: true },
        where: { status: "COMPLETED" }
      }),
      prisma.sale.groupBy({
        by: ["paymentMethod"],
        _sum: { totalCents: true },
        _count: { _all: true },
        where: { status: "COMPLETED" }
      }),
      prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          student: { select: { fullName: true, matricula: true } },
          cashier: { select: { fullName: true } },
          items: { select: { id: true } }
        }
      }),
      prisma.saleItem.groupBy({
        by: ["productId", "productName"],
        _sum: { quantity: true, totalCents: true },
        orderBy: { _sum: { totalCents: "desc" } },
        take: 5
      })
    ]);

  const totalMethod = byMethod.reduce(
    (s, m) => s + (m._sum.totalCents ?? 0),
    0
  );

  return (
    <div className="px-6 py-8 md:px-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Reporte de ventas
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
          Ventas y desempeño
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Datos cargados directamente desde Supabase Postgres vía Prisma.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Hoy", todayAgg],
          ["7 días", weekAgg],
          ["Total histórico", totalAgg]
        ].map(([label, agg]: any) => (
          <div
            key={label}
            className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"
          >
            <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
              {label}
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-ink-900">
              {mxn(agg._sum.totalCents ?? 0)}
            </div>
            <div className="mt-1 text-xs text-ink-500">
              {agg._count._all} transacciones
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-ink-900">
            Mezcla de pago (histórico)
          </h2>
          {byMethod.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">
              Aún no hay ventas registradas.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {byMethod.map((m) => {
                const pct =
                  totalMethod === 0
                    ? 0
                    : Math.round(((m._sum.totalCents ?? 0) / totalMethod) * 100);
                return (
                  <li key={m.paymentMethod}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold text-ink-900">
                        {m.paymentMethod === "BALANCE"
                          ? "Saldo prepagado"
                          : m.paymentMethod === "CASH"
                          ? "Efectivo"
                          : "Tarjeta"}
                      </span>
                      <span className="font-mono text-xs text-ink-500">
                        {m._count._all} ventas · {mxn(m._sum.totalCents ?? 0)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-ink-900">
            Top 5 productos
          </h2>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">Sin ventas aún.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map((p) => (
                <li key={p.productId} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 truncate font-semibold text-ink-900">
                    {p.productName}
                  </span>
                  <span className="font-mono text-xs text-ink-500">
                    {p._sum.quantity ?? 0} u
                  </span>
                  <span className="font-mono text-sm font-bold text-ink-900">
                    {mxn(p._sum.totalCents ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
        <h2 className="border-b border-ink-100 px-5 py-4 text-base font-semibold text-ink-900">
          Últimas 25 ventas
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-ink-50/50 text-2xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Folio</th>
              <th className="px-4 py-3 text-left font-semibold">Cuándo</th>
              <th className="px-4 py-3 text-left font-semibold">Alumno</th>
              <th className="px-4 py-3 text-left font-semibold">Cajero</th>
              <th className="px-4 py-3 text-center font-semibold">Pago</th>
              <th className="px-4 py-3 text-right font-semibold">Items</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {recent.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-400">
                  Aún no hay ventas. Cobra una desde la pestaña Cobro POS.
                </td>
              </tr>
            )}
            {recent.map((s) => (
              <tr key={s.id} className="hover:bg-ink-50/50">
                <td className="px-4 py-3 font-mono text-xs text-ink-700">
                  {s.folio}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-500">
                  {dateTimeShort(s.createdAt)}
                </td>
                <td className="px-4 py-3 text-ink-700">
                  {s.student?.fullName ?? <span className="text-ink-400">—</span>}
                </td>
                <td className="px-4 py-3 text-ink-700">
                  {s.cashier.fullName ?? "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded-md bg-ink-100 px-2 py-0.5 font-mono text-2xs text-ink-700">
                    {s.paymentMethod}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink-500">
                  {s.items.length}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-ink-900">
                  {mxn(s.totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
