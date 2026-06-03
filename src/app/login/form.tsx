"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "@/components/ui/icons";
import { signInWithPassword, type AuthState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      variant="secondary"
      loading={pending}
      className="w-full"
    >
      Entrar al panel admin
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useFormState<AuthState, FormData>(
    signInWithPassword,
    null
  );
  const [show, setShow] = useState(false);
  const needsConfirmation =
    state && !state.ok && state.needsConfirmation === true;

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="director@dominio.mx"
        autoComplete="email"
        required
        leftIcon={<Mail className="h-[18px] w-[18px]" />}
      />

      <Input
        name="password"
        type={show ? "text" : "password"}
        label="Contraseña"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        leftIcon={<Lock className="h-[18px] w-[18px]" />}
        rightSlot={
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />

      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex cursor-pointer items-center gap-2 text-ink-600">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Mantener sesión iniciada
        </label>
        <Link
          href="/forgot-password"
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          ¿Olvidaste?
        </Link>
      </div>

      {state?.ok === false && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">{state.error}</p>
          {needsConfirmation && state.email && (
            <Link
              href={`/auth/check-email?email=${encodeURIComponent(state.email)}`}
              className="mt-1 inline-block text-xs font-semibold underline"
            >
              Reenviar email de confirmación →
            </Link>
          )}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
