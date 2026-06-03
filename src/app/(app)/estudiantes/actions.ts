"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLinkCode } from "@/lib/codes";

export type CreateStudentState =
  | { ok: true; id: string; linkCode: string }
  | { ok: false; error: string }
  | null;

function slugQr(matricula: string) {
  return `QR-${matricula.replace(/\W+/g, "").toUpperCase()}`;
}

/**
 * Generate a link code that doesn't collide with anything already in the
 * database. Retry a few times on the extremely unlikely collision before
 * giving up.
 */
async function uniqueLinkCode(maxAttempts = 5): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateLinkCode();
    const taken = await prisma.student.findUnique({
      where: { linkCode: candidate },
      select: { id: true }
    });
    if (!taken) return candidate;
  }
  throw new Error("Could not generate a unique link code");
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
    const linkCode = await uniqueLinkCode();
    const s = await prisma.student.create({
      data: {
        matricula,
        fullName,
        grade,
        guardianName,
        guardianEmail,
        guardianPhone,
        qrCode: slugQr(matricula),
        linkCode,
        balanceCents: 0
      }
    });
    revalidatePath("/estudiantes");
    return { ok: true, id: s.id, linkCode };
  } catch (e: any) {
    if (String(e?.code) === "P2002") {
      return { ok: false, error: "Esa matrícula ya existe." };
    }
    return { ok: false, error: e?.message ?? "Error al crear alumno." };
  }
}
