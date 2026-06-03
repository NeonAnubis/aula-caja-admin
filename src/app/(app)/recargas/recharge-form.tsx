"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mxn } from "@/lib/format";
import { recordRecharge, type RechargeState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      variant="secondary"
      loading={pending}
      className="w-full"
    >
      Registrar recarga
    </Button>
  );
}

const METHODS = [
  ["CASH", "Efectivo"],
  ["OXXO", "OXXO Pay"],
  ["SPEI", "SPEI"],
  ["CARD", "Tarjeta"],
  ["MERCADO_PAGO", "Mercado Pago"],
  ["MANUAL_ADJUSTMENT", "Ajuste manual"]
] as const;

export function RechargeForm() {
  const [state, action] = useFormState<RechargeState, FormData>(
    recordRecharge,
    null
  );

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft">
      <h2 className="text-base font-semibold text-ink-900">Nueva recarga</h2>
      <p className="text-xs text-ink-500">
        El monto se acredita al saldo del alumno y se genera un movimiento de
        tesorería automático.
      </p>

      {state?.ok && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            ✓ Recarga {state.folio} aplicada
          </p>
          <p className="mt-0.5 text-xs text-emerald-700">
            {mxn(state.amountCents)} acreditados a {state.student}.
          </p>
        </div>
      )}

      <form action={action} className="mt-4 flex flex-col gap-4">
        <Input
          name="studentQuery"
          label="Alumno (matrícula, QR o nombre)"
          placeholder="VER-2026-0142"
          required
        />

        <Input
          name="amount"
          label="Monto (MXN)"
          placeholder="500.00"
          inputMode="decimal"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Método
          </label>
          <select
            name="method"
            required
            defaultValue="CASH"
            className="rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            {METHODS.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        <Input
          name="reference"
          label="Referencia (opcional)"
          placeholder="No. SPEI, folio OXXO, …"
        />

        <Input
          name="notes"
          label="Notas (opcional)"
          placeholder="Observaciones"
        />

        {state?.ok === false && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {state.error}
          </p>
        )}

        <Submit />
      </form>
    </section>
  );
}
