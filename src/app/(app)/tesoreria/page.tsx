import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mxn, dateTimeShort } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tesorería . Aula Caja" };

export default async function TreasuryPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [ingresosHoy, egresosHoy, byAccount, recent] = await Promise.all([
    prisma.treasuryMovement.aggregate({
      _sum: { amountCents: true },
      where: { type: "INCOME", createdAt: { gte: todayStart } }
    }),
    prisma.treasuryMovement.aggregate({
      _sum: { amountCents: true },
      where: { type: "EXPENSE", createdAt: { gte: todayStart } }
    }),
    prisma.treasuryMovement.groupBy({
      by: ["account", "type"],
      _sum: { amountCents: true }
    }),
    prisma.treasuryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { createdBy: { select: { fullName: true } } }
    })
  ]);

  // Net per account
  const accounts = new Map<string, number>();
  for (const r of byAccount) {
    const sign = r.type === "INCOME" ? 1 : -1;
    accounts.set(
      r.account,
      (accounts.get(r.account) ?? 0) + sign * (r._sum.amountCents ?? 0)
    );
  }
  const accountRows = Array.from(accounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  const netHoy =
    (ingresosHoy._sum.amountCents ?? 0) - (egresosHoy._sum.amountCents ?? 0);

  return (
    <div className="px-6 py-8 md:px-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Tesorería
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
          Flujos de efectivo
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Cada venta y recarga genera un movimiento aquí automáticamente.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
            Ingresos hoy
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-emerald-600">
            + {mxn(ingresosHoy._sum.amountCents ?? 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
            Egresos hoy
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-red-600">
            − {mxn(egresosHoy._sum.amountCents ?? 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
            Neto del día
          </div>
          <div
            className={
              "mt-2 font-display text-3xl font-bold " +
              (netHoy >= 0 ? "text-ink-900" : "text-red-600")
            }
          >
            {netHoy >= 0 ? "" : "−"} {mxn(Math.abs(netHoy))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-ink-900">
            Saldo por cuenta
          </h2>
          {accountRows.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">Sin movimientos aún.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {accountRows.map(([account, net]) => (
                <li
                  key={account}
                  className="flex items-baseline justify-between border-b border-ink-100 pb-2"
                >
                  <span className="text-sm font-semibold text-ink-700">
                    {account}
                  </span>
                  <span
                    className={
                      "font-mono text-sm font-bold " +
                      (net >= 0 ? "text-ink-900" : "text-red-600")
                    }
                  >
                    {mxn(net)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          <h2 className="border-b border-ink-100 px-5 py-4 text-base font-semibold text-ink-900">
            Últimos 30 movimientos
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-ink-50/50 text-2xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Cuándo</th>
                <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                <th className="px-4 py-3 text-left font-semibold">Cuenta</th>
                <th className="px-4 py-3 text-right font-semibold">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-400">
                    Sin movimientos. Realiza una venta o recarga para ver actividad.
                  </td>
                </tr>
              )}
              {recent.map((m) => {
                const isIn = m.type === "INCOME";
                return (
                  <tr key={m.id} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">
                      {dateTimeShort(m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-900">
                        {m.concept}
                      </div>
                      {m.reference && (
                        <div className="font-mono text-2xs text-ink-400">
                          {m.reference}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{m.account}</td>
                    <td
                      className={
                        "px-4 py-3 text-right font-mono text-sm font-bold " +
                        (isIn ? "text-emerald-600" : "text-red-600")
                      }
                    >
                      {isIn ? "+ " : "− "}
                      {mxn(m.amountCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
