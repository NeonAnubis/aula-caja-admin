"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { createStudent, type CreateStudentState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyCode } from "./copy-code";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      Crear alumno
    </Button>
  );
}

export function NewStudentForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<CreateStudentState, FormData>(
    createStudent,
    null
  );

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        + Nuevo alumno
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success state: show the generated tutor link code prominently */}
            {state?.ok ? (
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                    <path d="m5 12 5 5 9-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-bold text-ink-900">
                  Alumno creado
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Entrega este código al tutor. Lo usará en el portal para
                  vincular su cuenta con el alumno.
                </p>

                <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50/60 p-5">
                  <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                    Código del tutor
                  </div>
                  <div className="mt-3 flex justify-center">
                    {/* Big, readable rendering plus the copy button */}
                    <span className="font-mono text-3xl font-bold tracking-[0.25em] text-ink-900">
                      {state.linkCode}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <CopyCode code={state.linkCode} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-ink-400">
                  Siempre puedes volver a verlo en la columna{" "}
                  <strong className="text-ink-600">Código tutor</strong> de esta
                  tabla.
                </p>

                <div className="mt-6 flex justify-center">
                  <Button variant="primary" onClick={close}>
                    Entendido
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-ink-900">Nuevo alumno</h2>
                <p className="text-sm text-ink-500">
                  Crea un alumno con saldo inicial de $0.00. Al guardarlo se
                  genera un código de tutor automáticamente.
                </p>

                <form action={action} className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Input
                    name="matricula"
                    label="Matrícula"
                    placeholder="VER-2026-1234"
                    required
                  />
                  <Input
                    name="grade"
                    label="Grado"
                    placeholder="3 Sec A"
                    required
                  />
                  <Input
                    className="sm:col-span-2"
                    name="fullName"
                    label="Nombre completo"
                    placeholder="Nombre Apellido Apellido"
                    required
                  />
                  <Input
                    name="guardianName"
                    label="Tutor"
                    placeholder="Padre o madre"
                  />
                  <Input
                    name="guardianPhone"
                    label="WhatsApp del tutor"
                    placeholder="+52 55 ..."
                  />
                  <Input
                    className="sm:col-span-2"
                    name="guardianEmail"
                    type="email"
                    label="Email del tutor"
                    placeholder="tutor@email.com"
                  />

                  {state?.ok === false && (
                    <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                      {state.error}
                    </p>
                  )}

                  <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
                    <Button type="button" variant="ghost" onClick={close}>
                      Cancelar
                    </Button>
                    <Submit />
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
