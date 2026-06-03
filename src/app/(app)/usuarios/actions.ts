"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";
import type { UserRole } from "@prisma/client";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function setRole(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  const session = await requireRole(["ADMIN"]);

  if (!userId) return { ok: false, error: "userId requerido" };
  if (!["ADMIN", "CASHIER", "PARENT"].includes(role))
    return { ok: false, error: "rol inválido" };

  // Safety: do not let an admin demote themselves and lock everyone out
  if (userId === session.userId && role !== "ADMIN") {
    return {
      ok: false,
      error:
        "No puedes quitarte tu propio rol de ADMIN. Pide a otro administrador que lo haga."
    };
  }

  // Don't allow demoting the last remaining ADMIN
  if (role !== "ADMIN") {
    const target = await prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (target?.role === "ADMIN") {
      const adminCount = await prisma.profile.count({
        where: { role: "ADMIN", active: true }
      });
      if (adminCount <= 1) {
        return {
          ok: false,
          error:
            "No puedes quitar el último administrador activo. Promueve a otro usuario primero."
        };
      }
    }
  }

  await prisma.profile.update({ where: { id: userId }, data: { role } });
  revalidatePath("/usuarios");
  return { ok: true, message: `Rol actualizado a ${role}.` };
}

export async function setActive(
  userId: string,
  active: boolean
): Promise<ActionResult> {
  const session = await requireRole(["ADMIN"]);

  if (!userId) return { ok: false, error: "userId requerido" };

  if (userId === session.userId && !active) {
    return {
      ok: false,
      error: "No puedes desactivarte a ti mismo."
    };
  }

  await prisma.profile.update({ where: { id: userId }, data: { active } });
  revalidatePath("/usuarios");
  return {
    ok: true,
    message: active ? "Usuario reactivado." : "Usuario desactivado."
  };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await requireRole(["ADMIN"]);

  if (userId === session.userId)
    return { ok: false, error: "No puedes eliminarte a ti mismo." };

  // Check it isn't the last admin
  const target = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  if (target?.role === "ADMIN") {
    const adminCount = await prisma.profile.count({
      where: { role: "ADMIN", active: true }
    });
    if (adminCount <= 1) {
      return {
        ok: false,
        error: "No puedes eliminar el último administrador activo."
      };
    }
  }

  const svc = await createServiceClient();
  // Deleting from auth.users cascades via the same uuid into profiles (we
  // don't have ON DELETE CASCADE on profiles ↔ auth.users, so be explicit).
  await prisma.profile.delete({ where: { id: userId } }).catch(() => undefined);
  const { error } = await svc.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/usuarios");
  return { ok: true, message: "Usuario eliminado." };
}
