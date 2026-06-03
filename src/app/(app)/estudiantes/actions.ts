"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CreateStudentState =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | null;

function slugQr(matricula: string) {
  return `QR-${matricula.replace(/\W+/g, "").toUpperCase()}`;
}

export async function createStudent(
  _prev: CreateStudentState,
  formData: FormData
): Promise<CreateStudentState> {
  await requireUser();

  const matricula = String(formData.get("matricula") ?? "").trim().toUpperCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const guardianName = String(formData.get("guardianName") ?? "").trim() || null;
  const guardianEmail = String(formData.get("guardianEmail") ?? "").trim() || null;
  const guardianPhone = String(formData.get("guardianPhone") ?? "").trim() || null;

  if (!matricula || !fullName || !grade) {
    return { ok: false, error: "Matrícula, nombre y grado son obligatorios." };
  }

  try {
    const s = await prisma.student.create({
      data: {
        matricula,
        fullName,
        grade,
        guardianName,
        guardianEmail,
        guardianPhone,
        qrCode: slugQr(matricula),
        balanceCents: 0
      }
    });
    revalidatePath("/estudiantes");
    return { ok: true, id: s.id };
  } catch (e: any) {
    if (String(e?.code) === "P2002") {
      return { ok: false, error: "Esa matrícula ya existe." };
    }
    return { ok: false, error: e?.message ?? "Error al crear alumno." };
  }
}
