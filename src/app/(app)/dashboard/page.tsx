import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mxn, dateTimeShort } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inicio . Aula Caja" };

async function getOverview(): Promise<{
  studentsActive: number;
  productsActive: number;
  lowStock: number;
  balanceTotalCents: number;
  todaySalesCount: number;
  todaySalesCents: number;
  todayRechargesCents: number;
  recentSales: Array<{
    id: string;
    folio: string;
    totalCents: number;
    paymentMethod: string;
    student: string | null;
    when: Date;
  }>;
  lowStockItems: Array<{
    sku: string;
    name: string;
    stock: number;
    stockMin: number;
  }>;
}> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    studentsActive,
    productsActive,
    lowStockCount,
    balanceAgg,
    salesAgg,
    rechargesAgg,
    recentSalesRows,
    lowStockRows
  ] = await Promise.all([
    prisma.student.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({
      where: { active: true, stock: { lt: prisma.product.fields.stockMin } as any }
    }).catch(async () => {
      // Prisma can't reference another column directly in a where in some versions
      const all = await prisma.product.findMany({ where: { active: true } });
      return all.filter((p) => p.stock < p.stockMin).length;
    }),
    prisma.student.aggregate({ _sum: { balanceCents: true } }),
    prisma.sale.aggregate({
      _sum: { totalCents: true },
      _count: { _all: true },
      where: { createdAt: { gte: todayStart }, status: "COMPLETED" }
    }),
    prisma.recharge.aggregate({
      _sum: { amountCents: true },
      where: { createdAt: { gte: todayStart } }
    }),
    prisma.sale.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { student: { select: { fullName: true } } }
    }),
    prisma.product
      .findMany({ where: { active: true } })
      .then((items) => items.filter((p) => p.stock < p.stockMin).slice(0, 6))
  ]);

  return {
    studentsActive,
    productsActive,
    lowStock: typeof lowStockCount === "number" ? lowStockCount : lowStockRows.length,
    balanceTotalCents: balanceAgg._sum.balanceCents ?? 0,
    todaySalesCount: salesAgg._count._all,
    todaySalesCents: salesAgg._sum.totalCents ?? 0,
    todayRechargesCents: rechargesAgg._sum.amountCents ?? 0,
    recentSales: recentSalesRows.map((s) => ({
      id: s.id,
      folio: s.folio,
      totalCents: s.totalCents,
      paymentMethod: s.paymentMethod,
      student: s.student?.fullName ?? null,
      when: s.createdAt
    })),
    lowStockItems: lowStockRows
  };
}

export default async function DashboardPage() {
  const session = await requireUser();
  const overview = await getOverview();
  const firstName =
    session.profile.fullName?.split(" ")[0] ??
    session.email.split("@")[0];

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Aula Caja · panel del cajero
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Buen día, {firstName}.
          </h1>
          <p className="mt-2 text-ink-500">
            Tu rol es{" "}
            <strong className="font-semibold text-ink-900">
              {session.profile.role.toLowerCase()}
            </strong>
            . Aquí está el estado de la tienda hoy.
          </p>
        </div>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-glow hover:bg-brand-600"
        >
          Abrir caja →
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Ventas hoy",
            value: mxn(overview.todaySalesCents),
            sub: `${overview.todaySalesCount} transacciones`
          },
          {
            label: "Recargas hoy",
            value: mxn(overview.todayRechargesCents),
            sub: "recibidas en portal y caja"
          },
          {
            label: "Saldo cargado",
            value: mxn(overview.balanceTotalCents),
            sub: `${overview.studentsActive} alumnos activos`
          },
          {
            label: "Stock bajo",
            value: String(overview.lowStock),
            sub: `de ${overview.productsActive} productos`
          }
        ].map((k) => (
          <Card key={k.label}>
            <CardContent>
              <div className="text-2xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                {k.label}
              </div>
              <div className="mt-1 font-display text-3xl font-bold text-ink-900">
                {k.value}
              </div>
              <div className="mt-1 text-xs text-ink-500">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Recent sales */}
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">
                Últimas ventas
              </h2>
              <Link
                href="/ventas"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                ver todo →
              </Link>
            </div>
            {overview.recentSales.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-4 py-6 text-center text-sm text-ink-400">
                Aún no hay ventas. Cuando cobres en{" "}
                <Link
                  href="/pos"
                  className="font-semibold text-brand-600 underline"
                >
                  Cobro POS
                </Link>{" "}
                aparecerán aquí.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {overview.recentSales.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3 text-sm">
                    <span className="rounded-md border border-ink-200 px-2 py-0.5 font-mono text-2xs text-ink-500">
                      {s.folio}
                    </span>
                    <span className="flex-1 truncate text-ink-700">
                      {s.student ?? "Venta sin alumno"}
                    </span>
                    <span className="text-2xs font-mono uppercase tracking-wider text-ink-400">
                      {s.paymentMethod}
                    </span>
                    <span className="font-mono text-sm font-bold text-ink-900">
                      {mxn(s.totalCents)}
                    </span>
                    <span className="hidden font-mono text-2xs text-ink-400 sm:inline">
                      {dateTimeShort(s.when)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">
                Stock bajo
              </h2>
              <Link
                href="/inventario"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                ver inventario →
              </Link>
            </div>
            {overview.lowStockItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-4 py-6 text-center text-sm text-ink-400">
                Nada bajo mínimo. Buena cobertura.
              </p>
            ) : (
              <ul className="space-y-3">
                {overview.lowStockItems.map((p) => (
                  <li
                    key={p.sku}
                    className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2"
                  >
                    <span className="rounded-md border border-amber-300 bg-white px-2 py-0.5 font-mono text-2xs text-amber-800">
                      {p.sku}
                    </span>
                    <span className="flex-1 truncate text-sm text-ink-900">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-700">
                      {p.stock} / {p.stockMin}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
