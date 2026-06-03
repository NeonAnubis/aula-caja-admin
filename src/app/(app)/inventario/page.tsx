import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mxn } from "@/lib/format";
import { NewProductForm } from "./new-product-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inventario . Aula Caja" };

export default async function InventoryPage({
  searchParams
}: {
  searchParams: { q?: string; category?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const cat = searchParams.category ?? null;

  const all = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });

  const filtered = all.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (!q) return true;
    const lc = q.toLowerCase();
    return (
      p.name.toLowerCase().includes(lc) ||
      p.sku.toLowerCase().includes(lc) ||
      p.category.toLowerCase().includes(lc)
    );
  });

  const categories = Array.from(new Set(all.map((p) => p.category))).sort();
  const stats = {
    total: all.length,
    low: all.filter((p) => p.stock > 0 && p.stock < p.stockMin).length,
    out: all.filter((p) => p.stock === 0).length
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Inventario
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900">
            Catálogo de productos
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {stats.total} productos · {stats.low} con stock bajo ·{" "}
            <span className="text-red-600">{stats.out} agotados</span>
          </p>
        </div>
        <NewProductForm />
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-2" action="/inventario" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar producto, SKU o categoría…"
          className="flex-1 min-w-[200px] rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        <select
          name="category"
          defaultValue={cat ?? ""}
          className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-ink-50"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-ink-50/50 text-2xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">SKU</th>
              <th className="px-4 py-3 text-left font-semibold">Producto</th>
              <th className="px-4 py-3 text-left font-semibold">Categoría</th>
              <th className="px-4 py-3 text-right font-semibold">Precio</th>
              <th className="px-4 py-3 text-center font-semibold">Stock</th>
              <th className="px-4 py-3 text-center font-semibold">Mínimo</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-400">
                  Sin productos con esos filtros.
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const status =
                p.stock === 0
                  ? { label: "Agotado", c: "bg-red-100 text-red-700" }
                  : p.stock < p.stockMin
                  ? { label: "Stock bajo", c: "bg-amber-100 text-amber-700" }
                  : { label: "Saludable", c: "bg-emerald-100 text-emerald-700" };
              return (
                <tr key={p.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">
                    {p.sku}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{p.name}</td>
                  <td className="px-4 py-3 text-ink-700">{p.category}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-ink-900">
                    {mxn(p.priceCents)}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm font-bold">
                    {p.stock}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-ink-500">
                    {p.stockMin}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-md px-2 py-0.5 font-mono text-2xs font-bold " +
                        status.c
                      }
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
