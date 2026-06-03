"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, Check
} from "@/components/ui/icons";
import { signUpWithPassword, type RegisterState } from "./actions";

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
      Crear cuenta
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export function RegisterForm() {
  const [state, action] = useFormState<RegisterState, FormData>(
    signUpWithPassword,
    null
  );
  const [show, setShow] = useState(false);
  const [pwd, setPwd] = useState("");
  const router = useRouter();
  const s = strength(pwd);

  useEffect(() => {
    if (state?.ok) {
      if (state.needsConfirmation) {
        router.push(`/auth/check-email?email=${encodeURIComponent(state.email)}`);
      } else {
        router.push("/dashboard");
      }
    }
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input
        name="fullName"
        type="text"
        label="Nombre completo"
        placeholder="Michael Lee"
        autoComplete="name"
        required
        leftIcon={<User className="h-[18px] w-[18px]" />}
      />

      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="tu@dominio.mx"
        autoComplete="email"
        required
        leftIcon={<Mail className="h-[18px] w-[18px]" />}
        hint="Te enviaremos un enlace de confirmación a este email."
      />

      <div>
        <Input
          name="password"
          type={show ? "text" : "password"}
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
          minLength={8}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
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
        {pwd && (
          <div className="mt-3 flex items-center gap-2 px-1">
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 flex-1 rounded-full transition-colors " +
                    (i < s
                      ? s <= 1
                        ? "bg-red-400"
                        : s === 2
                        ? "bg-amber-400"
                        : "bg-brand-500"
                      : "bg-ink-200")
                  }
                />
              ))}
            </div>
            <span className="text-2xs font-mono uppercase tracking-wider text-ink-500">
              {["muy débil", "débil", "aceptable", "fuerte", "excelente"][s]}
            </span>
          </div>
        )}
      </div>

      <ul className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4 text-xs text-ink-600">
        {[
          "Recibirás un email con un enlace de confirmación",
          "El primer usuario registrado se vuelve administrador",
          "Datos protegidos en todas las tablas"
        ].map((line) => (
          <li key={line} className="flex items-start gap-2 py-0.5">
            <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-brand-600" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {state?.ok === false && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
