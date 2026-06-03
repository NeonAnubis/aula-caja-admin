import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PosClient } from "./pos-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cobro POS . Aula Caja" };

export default async function PosPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      sku: true,
      name: true,
      category: true,
      priceCents: true,
      stock: true
    }
  });

  return (
    <div className="p-4">
      <PosClient products={products} />
    </div>
  );
}
