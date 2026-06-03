"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";
import { genFolio } from "@/lib/format";

export type CartItem = { productId: string; quantity: number };

export type RecordSaleInput = {
  studentId: string | null;
  paymentMethod: "BALANCE" | "CASH" | "CARD";
  items: CartItem[];
  discountCents?: number;
  notes?: string | null;
};

export type RecordSaleResult =
  | { ok: true; saleId: string; folio: string; totalCents: number }
  | { ok: false; error: string };

function parseRpcError(message: string): string {
  // The record_sale RPC raises structured errors like
  //   insufficient_stock:AC013:4
  // Translate them to friendly Spanish messages.
  if (message.startsWith("insufficient_stock:")) {
    const [, sku, available] = message.split(":");
    return `Stock insuficiente para SKU ${sku}. Quedan ${available} unidades.`;
  }
  if (message.startsWith("insufficient_balance:")) {
    const [, have, need] = message.split(":");
    const haveM = (parseInt(have, 10) / 100).toFixed(2);
    const needM = (parseInt(need, 10) / 100).toFixed(2);
    return `Saldo insuficiente. El alumno tiene $${haveM} y la venta es $${needM}.`;
  }
  if (message.includes("product_not_found")) return "Uno de los productos ya no está disponible.";
  if (message.includes("product_inactive")) return "Uno de los productos está inactivo.";
  if (message.includes("student_not_found")) return "El alumno no existe.";
  if (message.includes("student_required_for_balance"))
    return "Para cobrar con saldo, primero selecciona un alumno.";
  if (message.includes("invalid_quantity")) return "Cantidad inválida en el carrito.";
  return message;
}

export async function recordSale(input: RecordSaleInput): Promise<RecordSaleResult> {
  if (!input.items || input.items.length === 0) {
    return { ok: false, error: "El carrito está vacío." };
  }
  if (input.paymentMethod === "BALANCE" && !input.studentId) {
    return { ok: false, error: "Selecciona un alumno para cobrar con saldo." };
  }

  const session = await requireUser();

  // Build next sale folio (small race but acceptable for cashier UX; the
  // unique constraint on folio is the hard guard).
  const count = await prisma.sale.count();
  const folio = genFolio("SALE", count + 1);

  const svc = await createServiceClient();
  const { data, error } = await svc.rpc("record_sale", {
    p_folio: folio,
    p_student_id: input.studentId,
    p_cashier_id: session.userId,
    p_payment_method: input.paymentMethod,
    p_items: input.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity
    })),
    p_discount_cents: input.discountCents ?? 0,
    p_notes: input.notes ?? null
  });

  if (error) {
    return { ok: false, error: parseRpcError(error.message) };
  }

  const sale = await prisma.sale.findUnique({
    where: { folio },
    select: { id: true, folio: true, totalCents: true }
  });
  if (!sale) return { ok: false, error: "Venta creada pero no encontrada." };

  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/ventas");
  revalidatePath("/tesoreria");
  revalidatePath("/inventario");

  return { ok: true, saleId: sale.id, folio: sale.folio, totalCents: sale.totalCents };
}

export async function lookupStudentByQr(query: string) {
  const q = query.trim();
  if (!q) return null;

  const student = await prisma.student.findFirst({
    where: {
      active: true,
      OR: [
        { qrCode:    { equals: q, mode: "insensitive" } },
        { matricula: { equals: q, mode: "insensitive" } },
        { fullName:  { contains: q, mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      matricula: true,
      fullName: true,
      grade: true,
      balanceCents: true
    }
  });
  return student;
}
