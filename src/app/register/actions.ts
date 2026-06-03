"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils";

export type RegisterState =
  | { ok: true; email: string; needsConfirmation: boolean }
  | { ok: false; error: string }
  | null;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function isRateLimit(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("too many") ||
    m.includes("over_email_send_rate_limit")
  );
}

export async function signUpWithPassword(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName) return { ok: false, error: "Ingresa tu nombre completo." };
  if (!EMAIL_RX.test(email))
    return { ok: false, error: "Ingresa un email válido." };
  if (password.length < 8)
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };

  // -------- Dev fast path --------
  // AUTO_CONFIRM_SIGNUPS=true skips the email entirely by creating the user
  // via the service-role admin API with email_confirm already set. The
  // trigger still fires, so public.profiles gets the new row normally.
  // Useful when Supabase's default SMTP has rate-limited you.
  if (process.env.AUTO_CONFIRM_SIGNUPS === "true") {
    const svc = await createServiceClient();
    const { error } = await svc.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        return {
          ok: false,
          error:
            "Ya existe una cuenta con ese email. Inicia sesión."
        };
      }
      return { ok: false, error: error.message };
    }
    // Account is already confirmed — needsConfirmation = false sends the
    // form to /dashboard directly via the existing redirect logic.
    return { ok: true, email, needsConfirmation: false };
  }

  // -------- Normal email-confirmation path --------
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
      data: { full_name: fullName }
    }
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return {
        ok: false,
        error:
          "Ya existe una cuenta con ese email. Si la registraste pero no confirmaste, revisa tu bandeja de entrada."
      };
    }
    if (isRateLimit(error.message)) {
      return {
        ok: false,
        error:
          "Supabase limitó el envío de emails de confirmación (cuota gratuita: pocos correos por hora). Opciones: espera ~60 min, configura SMTP propio en Supabase, o pon AUTO_CONFIRM_SIGNUPS=true en .env.local para saltar este paso en dev."
      };
    }
    return { ok: false, error: error.message };
  }

  const needsConfirmation = !data.session;
  return { ok: true, email, needsConfirmation };
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RX.test(email)) {
    redirect("/auth/check-email?error=email_invalido");
  }
  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard` }
  });
  if (error) {
    redirect(
      `/auth/check-email?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`
    );
  }
  redirect(`/auth/check-email?email=${encodeURIComponent(email)}&resent=1`);
}
