"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AuthState =
  | { ok: true }
  | { ok: false; error: string; needsConfirmation?: boolean; email?: string }
  | null;

function safeNext(next?: string | null) {
  if (!next || !next.startsWith("/")) return "/dashboard";
  return next;
}

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { ok: false, error: "Email y contraseña son obligatorios." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (error.message.toLowerCase().includes("not confirmed")) {
      return {
        ok: false,
        error: "Tu email aún no está confirmado. Revisa tu bandeja de entrada.",
        needsConfirmation: true,
        email
      };
    }
    return { ok: false, error: "Email o contraseña incorrectos." };
  }

  // -------- Role gate: ADMIN platform requires ADMIN role --------
  // We just signed the user in. If they're not an ADMIN, sign them out
  // immediately so they don't get any session cookies for this platform,
  // and tell them clearly where they should be signing in instead.
  const userId = data.user?.id;
  if (userId) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true, active: true }
    });
    if (!profile || profile.role !== "ADMIN" || !profile.active) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error:
          "Esta cuenta no tiene permisos de administrador. Inicia sesión desde el panel de operación (panel para cajeros)."
      };
    }
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
