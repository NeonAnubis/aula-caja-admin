import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mxn, dateShort } from "@/lib/format";
import { NewStudentForm } from "./new-student-form";
import { CopyCode } from "./copy-code";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Estudiantes . Aula Caja" };

export default async function StudentsPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();

  const where = q
    ? {
        OR: [
          { matricula: { contains: q, mode: "insensitive" as const } },
          { fullName:  { contains: q, mode: "insensitive" as const } },
          { guardianName: { contains: q, mode: "insensitive" as const } },
          { qrCode: { contains: q, mode: "insensitive" as const } }
        ]
      }
    : undefined;

  const [students, totalCount, balanceTotal] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { fullName: "asc" },
      take: 100
    }),
    prisma.student.count(),
    prisma.student.aggregate({ _sum: { balanceCents: true } })
  ]);

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Estudiantes
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
            Padrón de alumnos
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {totalCount} alumnos · saldo cargado total{" "}
            <strong className="text-ink-900">
              {mxn(balanceTotal._sum.balanceCents ?? 0)}
            </strong>
          </p>
        </div>
        <Suspense>
          <NewStudentForm />
        </Suspense>
      </div>

      <form className="mt-6 flex max-w-md gap-2" action="/estudiantes" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por matrícula, nombre o tutor…"
          className="flex-1 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="submit"
          className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-ink-50"
        >
          Buscar
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/50 text-2xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Matrícula</th>
              <th className="px-4 py-3 text-left font-semibold">Alumno</th>
              <th className="px-4 py-3 text-left font-semibold">Grado</th>
              <th className="px-4 py-3 text-left font-semibold">Tutor</th>
              <th className="px-4 py-3 text-left font-semibold">Código tutor</th>
              <th className="px-4 py-3 text-right font-semibold">Saldo</th>
              <th className="px-4 py-3 text-left font-semibold">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-400">
                  {q
                    ? "No se encontró ningún alumno con esos criterios."
                    : "Aún no hay alumnos. Crea el primero arriba."}
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-ink-50/50">
                <td className="px-4 py-3 font-mono text-xs text-ink-700">
                  {s.matricula}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink-900">{s.fullName}</div>
                  <div className="font-mono text-2xs text-ink-400">
                    {s.qrCode}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-700">{s.grade}</td>
                <td className="px-4 py-3 text-ink-700">{s.guardianName ?? "—"}</td>
                <td className="px-4 py-3">
                  <CopyCode code={s.linkCode} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      "font-mono text-sm font-bold " +
                      (s.balanceCents === 0
                        ? "text-red-600"
                        : s.balanceCents < 5000
                        ? "text-amber-600"
                        : "text-emerald-600")
                    }
                  >
                    {mxn(s.balanceCents)}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-2xs text-ink-400">
                  {dateShort(s.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
