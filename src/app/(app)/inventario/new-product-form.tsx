"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { createProduct, type ProductState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      Guardar producto
    </Button>
  );
}

export function NewProductForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<ProductState, FormData>(createProduct, null);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        + Nuevo producto
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-ink-900">Nuevo producto</h2>
            <p className="text-sm text-ink-500">
              Define SKU, precio en pesos y stock inicial.
            </p>
            <form action={action} className="mt-5 grid gap-3 sm:grid-cols-2">
              <Input name="sku" label="SKU" placeholder="AC025" required />
              <Input name="category" label="Categoría" placeholder="Comida" required />
              <Input
                className="sm:col-span-2"
                name="name"
                label="Nombre"
                placeholder="Producto descriptivo"
                required
              />
              <Input
                name="price"
                label="Precio (MXN)"
                placeholder="42.00"
                inputMode="decimal"
                required
              />
              <Input
                name="stock"
                type="number"
                label="Stock inicial"
                defaultValue="0"
                required
              />
              <Input
                name="stockMin"
                type="number"
                label="Stock mínimo"
                defaultValue="0"
                required
              />

              {state?.ok === false && (
                <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {state.error}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Submit />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
