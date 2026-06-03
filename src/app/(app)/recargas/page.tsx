import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mxn, dateTimeShort } from "@/lib/format";
import { RechargeForm } from "./recharge-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recargas . Aula Caja" };

export default async function RechargesPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [recent, todayAgg, weekCount] = await Promise.all([
    prisma.recharge.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        student: { select: { fullName: true, matricula: true } },
        recordedBy: { select: { fullName: true } }
      }
    }),
    prisma.recharge.aggregate({
      _sum: { amountCents: true },
      _count: { _all: true },
      where: { createdAt: { gte: todayStart } }
    }),
    prisma.recharge.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) }
      }
    })
  ]);

  return (
    <div className="px-6 py-8 md:px-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Portal de recargas
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
          Cargar saldo
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Las recargas hechas aquí afectan el saldo del alumno y se registran
          automáticamente en tesorería. Hoy: {todayAgg._count._all} recargas por{" "}
          <strong className="text-ink-900">
            {mxn(todayAgg._sum.amountCents ?? 0)}
          </strong>{" "}
          · últimos 7 días: {weekCount}.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <RechargeForm />

        <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="text-base font-semibold text-ink-900">
            Recargas recientes
          </h2>
          <p className="text-xs text-ink-500">Últimas 30 transacciones</p>

          {recent.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-4 py-10 text-center text-sm text-ink-400">
              Aún no hay recargas. Crea la primera con el formulario de la izquierda.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink-100">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="rounded-md border border-ink-200 px-2 py-0.5 font-mono text-2xs text-ink-500">
                    {r.folio}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink-900">
                      {r.student.fullName}
                    </div>
                    <div className="truncate font-mono text-2xs text-ink-400">
                      {r.student.matricula} · {r.method.toLowerCase()}
                      {r.reference ? ` · ${r.reference}` : ""}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-600">
                    + {mxn(r.amountCents)}
                  </span>
                  <span className="hidden font-mono text-2xs text-ink-400 sm:inline">
                    {dateTimeShort(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
