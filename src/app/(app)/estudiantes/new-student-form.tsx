"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { createStudent, type CreateStudentState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        + Nuevo alumno
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
            <h2 className="text-lg font-bold text-ink-900">Nuevo alumno</h2>
            <p className="text-sm text-ink-500">
              Crea un alumno con saldo inicial de $0.00. Después puedes
              recargarle desde la pestaña Recargas.
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
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
