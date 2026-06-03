"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";
import { genFolio, parseMxn } from "@/lib/format";

export type RechargeState =
  | { ok: true; folio: string; amountCents: number; student: string }
  | { ok: false; error: string }
  | null;

const METHODS = [
  "CASH",
  "OXXO",
  "SPEI",
  "CARD",
  "MERCADO_PAGO",
  "MANUAL_ADJUSTMENT"
] as const;

export async function recordRecharge(
  _prev: RechargeState,
  formData: FormData
): Promise<RechargeState> {
  const session = await requireUser();

  const studentQuery = String(formData.get("studentQuery") ?? "").trim();
  const amountInput = String(formData.get("amount") ?? "");
  const method = String(formData.get("method") ?? "") as (typeof METHODS)[number];
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!studentQuery) return { ok: false, error: "Identifica al alumno." };
  if (!METHODS.includes(method))
    return { ok: false, error: "Método de pago inválido." };

  const amountCents = parseMxn(amountInput);
  if (amountCents <= 0)
    return { ok: false, error: "Monto inválido." };

  const student = await prisma.student.findFirst({
    where: {
      active: true,
      OR: [
        { matricula: { equals: studentQuery, mode: "insensitive" } },
        { qrCode:    { equals: studentQuery, mode: "insensitive" } },
        { fullName:  { contains: studentQuery, mode: "insensitive" } }
      ]
    }
  });
  if (!student) return { ok: false, error: "No se encontró ese alumno." };

  const count = await prisma.recharge.count();
  const folio = genFolio("REC", count + 1);

  const svc = await createServiceClient();
  const { error } = await svc.rpc("record_recharge", {
    p_folio: folio,
    p_student_id: student.id,
    p_amount_cents: amountCents,
    p_method: method,
    p_recorded_by_id: session.userId,
    p_reference: reference,
    p_notes: notes
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/recargas");
  revalidatePath("/estudiantes");
  revalidatePath("/dashboard");
  revalidatePath("/tesoreria");

  return {
    ok: true,
    folio,
    amountCents,
    student: student.fullName
  };
}
