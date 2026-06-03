"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseMxn } from "@/lib/format";

export type ProductState =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | null;

export async function createProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  await requireUser();

  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const priceCents = parseMxn(String(formData.get("price") ?? ""));
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10) || 0;
  const stockMin = parseInt(String(formData.get("stockMin") ?? "0"), 10) || 0;

  if (!sku || !name || !category) {
    return { ok: false, error: "SKU, nombre y categoría son obligatorios." };
  }
  if (priceCents <= 0) return { ok: false, error: "Precio inválido." };
  if (stock < 0 || stockMin < 0)
    return { ok: false, error: "Stock no puede ser negativo." };

  try {
    const p = await prisma.product.create({
      data: { sku, name, category, priceCents, stock, stockMin }
    });
    revalidatePath("/inventario");
    revalidatePath("/pos");
    return { ok: true, id: p.id };
  } catch (e: any) {
    if (String(e?.code) === "P2002") {
      return { ok: false, error: "Ya existe un producto con ese SKU." };
    }
    return { ok: false, error: e?.message ?? "Error al crear producto." };
  }
}

export async function adjustStock(productId: string, delta: number) {
  await requireUser();
  if (!productId) throw new Error("productId required");
  if (!Number.isInteger(delta)) throw new Error("delta must be integer");
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: delta } }
  });
  revalidatePath("/inventario");
  revalidatePath("/pos");
}
