"use client";

import { useMemo, useState, useTransition } from "react";
import { mxn } from "@/lib/format";
import { recordSale, lookupStudentByQr } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, User } from "@/components/ui/icons";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  stock: number;
};

type Student = {
  id: string;
  matricula: string;
  fullName: string;
  grade: string;
  balanceCents: number;
} | null;

type CartLine = {
  productId: string;
  sku: string;
  name: string;
  priceCents: number;
  qty: number;
};

export function PosClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [student, setStudent] = useState<Student>(null);
  const [studentQuery, setStudentQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"BALANCE" | "CASH" | "CARD">("BALANCE");
  const [message, setMessage] = useState<
    { kind: "ok" | "err"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, search, category]);

  const subtotalCents = cart.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
  const balanceShort =
    paymentMethod === "BALANCE" &&
    student &&
    student.balanceCents < subtotalCents;

  function addToCart(p: Product) {
    setCart((c) => {
      const existing = c.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.qty >= p.stock) {
          setMessage({
            kind: "err",
            text: `Solo quedan ${p.stock} unidades de ${p.name}.`
          });
          return c;
        }
        return c.map((l) =>
          l.productId === p.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [
        ...c,
        { productId: p.id, sku: p.sku, name: p.name, priceCents: p.priceCents, qty: 1 }
      ];
    });
    setMessage(null);
  }

  function updateQty(productId: string, qty: number) {
    setCart((c) =>
      c
        .map((l) => (l.productId === productId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function clearCart() {
    setCart([]);
    setStudent(null);
    setStudentQuery("");
    setMessage(null);
  }

  async function doLookupStudent() {
    if (!studentQuery.trim()) {
      setStudent(null);
      return;
    }
    const s = await lookupStudentByQr(studentQuery.trim());
    if (!s) {
      setStudent(null);
      setMessage({ kind: "err", text: "No se encontró ningún alumno con ese identificador." });
      return;
    }
    setStudent(s);
    setMessage(null);
  }

  function doCharge() {
    if (cart.length === 0) {
      setMessage({ kind: "err", text: "Agrega productos al carrito primero." });
      return;
    }
    if (paymentMethod === "BALANCE" && !student) {
      setMessage({
        kind: "err",
        text: "Para cobrar con saldo, primero selecciona un alumno."
      });
      return;
    }

    startTransition(async () => {
      const result = await recordSale({
        studentId: student?.id ?? null,
        paymentMethod,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.qty }))
      });
      if (result.ok) {
        setMessage({
          kind: "ok",
          text: `Venta ${result.folio} cobrada por ${mxn(result.totalCents)}. Ticket emitido.`
        });
        clearCart();
      } else {
        setMessage({ kind: "err", text: result.error });
      }
    });
  }

  return (
    <div className="grid h-[calc(100vh-2rem)] grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
      {/* Left: products */}
      <section className="flex flex-col rounded-2xl border border-ink-100 bg-white shadow-soft">
        <div className="border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Buscar producto, SKU o categoría…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <span className="font-mono text-xs text-ink-400">
              {filtered.length} / {products.length}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors " +
                (!category
                  ? "bg-ink-900 text-white"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200")
              }
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={
                  "rounded-md px-3 py-1 text-xs font-semibold transition-colors " +
                  (category === c
                    ? "bg-ink-900 text-white"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200")
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const outOfStock = p.stock === 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => addToCart(p)}
                  className={
                    "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all " +
                    (outOfStock
                      ? "cursor-not-allowed border-ink-100 bg-ink-50 opacity-60"
                      : "border-ink-100 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-glow")
                  }
                >
                  <span className="font-mono text-2xs text-ink-400">{p.sku}</span>
                  <span className="line-clamp-2 text-sm font-semibold text-ink-900">
                    {p.name}
                  </span>
                  <span className="text-2xs uppercase tracking-wider text-ink-400">
                    {p.category}
                  </span>
                  <span className="mt-auto flex w-full items-end justify-between pt-2">
                    <span className="font-mono text-sm font-bold text-ink-900">
                      {mxn(p.priceCents)}
                    </span>
                    <span
                      className={
                        "rounded-md px-2 py-0.5 font-mono text-2xs font-semibold " +
                        (outOfStock
                          ? "bg-red-100 text-red-700"
                          : p.stock < 5
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700")
                      }
                    >
                      {outOfStock ? "agotado" : `stock ${p.stock}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Right: cart + checkout */}
      <aside className="flex flex-col rounded-2xl border border-ink-100 bg-white shadow-soft">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
            Alumno
          </h2>
          {student ? (
            <div className="mt-2 flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-ink-900">
                  {student.fullName}
                </div>
                <div className="font-mono text-2xs text-ink-500">
                  {student.matricula} · {student.grade}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xs uppercase tracking-wider text-ink-400">
                  saldo
                </div>
                <div className="font-mono text-sm font-bold text-emerald-600">
                  {mxn(student.balanceCents)}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <Input
                placeholder="QR, matrícula o nombre del alumno"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    doLookupStudent();
                  }
                }}
                leftIcon={<User className="h-4 w-4" />}
                className="flex-1"
              />
              <Button
                type="button"
                size="md"
                variant="outline"
                onClick={doLookupStudent}
              >
                Buscar
              </Button>
            </div>
          )}
          {student && (
            <button
              type="button"
              onClick={() => setStudent(null)}
              className="mt-2 text-xs font-semibold text-ink-500 hover:text-ink-900"
            >
              ← cambiar alumno
            </button>
          )}
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto border-b border-ink-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-500">
              Carrito ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                vaciar
              </button>
            )}
          </div>
          {cart.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-4 py-8 text-center text-sm text-ink-400">
              Toca un producto del listado para agregarlo.
            </p>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li
                  key={l.productId}
                  className="flex items-center gap-2 rounded-lg border border-ink-100 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink-900">
                      {l.name}
                    </div>
                    <div className="font-mono text-2xs text-ink-400">
                      {l.sku} · {mxn(l.priceCents)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQty(l.productId, l.qty - 1)}
                      className="h-7 w-7 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-mono text-sm font-bold">
                      {l.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(l.productId, l.qty + 1)}
                      className="h-7 w-7 rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-20 text-right font-mono text-sm font-bold text-ink-900">
                    {mxn(l.priceCents * l.qty)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Total + actions */}
        <div className="px-5 py-4">
          <div className="mb-4 flex items-end justify-between">
            <span className="text-sm font-medium text-ink-500">Total</span>
            <span className="font-display text-3xl font-bold text-ink-900">
              {mxn(subtotalCents)}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {(
              [
                ["BALANCE", "Saldo"],
                ["CASH", "Efectivo"],
                ["CARD", "Tarjeta"]
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={
                  "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors " +
                  (paymentMethod === m
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50")
                }
              >
                {label}
              </button>
            ))}
          </div>

          {message && (
            <p
              className={
                "mb-3 rounded-lg border px-3 py-2 text-sm font-medium " +
                (message.kind === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700")
              }
              role="status"
            >
              {message.kind === "ok" ? (
                <Check className="mr-1 inline h-4 w-4" />
              ) : null}
              {message.text}
            </p>
          )}

          {balanceShort && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              El saldo del alumno no alcanza para esta compra.
            </p>
          )}

          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={doCharge}
            disabled={cart.length === 0 || isPending || balanceShort === true}
            loading={isPending}
          >
            Cobrar {mxn(subtotalCents)}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </aside>
    </div>
  );
}
