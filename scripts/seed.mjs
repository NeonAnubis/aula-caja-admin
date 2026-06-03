#!/usr/bin/env node
/**
 * Seed Aula Caja with realistic Mexican school store data.
 * Idempotent — skips rows that already exist (matched by sku/matricula/rfc).
 *
 *   npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCTS = [
  ["AC001", "Sandwich pollo casero",       "Comida",     4500, 38, 10],
  ["AC002", "Sandwich jamon y queso",      "Comida",     3800, 24, 10],
  ["AC003", "Ensalada Cesar pollo",        "Comida",     6200, 12, 8],
  ["AC004", "Quesadilla queso doble",      "Comida",     3200, 28, 12],
  ["AC005", "Burrito de frijol y arroz",   "Comida",     4800, 18, 10],
  ["AC006", "Agua natural 600 ml",         "Bebida",     1800, 142, 30],
  ["AC007", "Refresco Coca Cola 355 ml",   "Bebida",     2400, 86, 30],
  ["AC008", "Jugo de naranja natural",     "Bebida",     2800, 32, 20],
  ["AC009", "Cafe Americano",              "Bebida",     2200, 999, 0],
  ["AC010", "Te helado limon",             "Bebida",     2200, 64, 20],
  ["AC011", "Fruta picada con yogurt",     "Saludable",  4200, 16, 10],
  ["AC012", "Barra de granola",            "Snacks",     1800, 72, 30],
  ["AC013", "Galletas Maria 4 pzs",        "Snacks",     1400, 4,  20],
  ["AC014", "Papas saladas 45 g",          "Snacks",     2200, 96, 30],
  ["AC015", "Chocolate Carlos V",          "Dulces",     1800, 0,  20],
  ["AC016", "Paleta payaso",               "Dulces",      800, 3,  30],
  ["AC017", "Cuaderno raya tamaño carta",  "Papeleria",  5800, 22, 12],
  ["AC018", "Boligrafo azul Bic",          "Papeleria",  1200, 184, 60],
  ["AC019", "Lapiz Mirado #2",             "Papeleria",   800, 98, 50],
  ["AC020", "Goma Pelikan blanca",         "Papeleria",  1000, 6,  20],
  ["AC021", "Sacapuntas con deposito",     "Papeleria",  2400, 18, 10],
  ["AC022", "Carpeta carta 3 anillos",     "Papeleria",  7800, 14, 8],
  ["AC023", "Marcador permanente Sharpie", "Papeleria",  3800, 32, 15],
  ["AC024", "Calculadora cientifica",      "Papeleria", 28500, 8,  4],
];

const STUDENTS = [
  ["VER-2026-0142", "Ana Sofia Ramirez Vega",    "3 Sec A",   "Maria Vega",       "maria.vega@email.com",     "+52 55 1234 5678", "QR-AC0142", 28650],
  ["VER-2026-0218", "Diego Martinez Lopez",      "5 Prim B",  "Carlos Martinez",  "carlos.mtz@email.com",     "+52 55 2345 6789", "QR-AC0218", 14200],
  ["VER-2026-0387", "Valentina Ortiz Cruz",      "1 Prep",    "Luis Ortiz",       "luis.ortiz@email.com",     "+52 55 3456 7890", "QR-AC0387", 41820],
  ["VER-2026-0492", "Mateo Hernandez Silva",     "6 Prim A",  "Patricia Silva",   "p.silva@email.com",        "+52 55 4567 8901", "QR-AC0492",  6200],
  ["VER-2026-0541", "Isabella Gomez Reyes",      "2 Sec B",   "Roberto Gomez",    "roberto.gomez@email.com",  "+52 55 5678 9012", "QR-AC0541", 19840],
  ["VER-2026-0608", "Santiago Morales Pena",     "4 Prim A",  "Lucia Morales",    "lucia.mor@email.com",      "+52 55 6789 0123", "QR-AC0608",  2450],
  ["VER-2026-0714", "Camila Jimenez Castro",     "3 Prep",    "Fernando Jimenez", "fernando.jim@email.com",   "+52 55 7890 1234", "QR-AC0714", 54280],
  ["VER-2026-0822", "Sebastian Fernandez Diaz",  "1 Sec C",   "Ana Fernandez",    "ana.fdz@email.com",        "+52 55 8901 2345", "QR-AC0822", 31200],
  ["VER-2026-0918", "Renata Sanchez Vargas",     "2 Prep",    "Daniel Sanchez",   "d.sanchez@email.com",      "+52 55 9012 3456", "QR-AC0918",     0],
  ["VER-2026-1024", "Maximiliano Rivas Trejo",   "5 Prim C",  "Andrea Rivas",     "andrea.rivas@email.com",   "+52 55 0123 4567", "QR-AC1024", 16450],
];

const SUPPLIERS = [
  ["BIM010101A21", "Grupo Bimbo SA de CV",     "Erik Vazquez",  "+52 55 5267 0700", "ventas@bimbo.com.mx"],
  ["CC0070101B12", "Coca Cola FEMSA",          "Sofia Reyes",   "+52 55 5081 5100", "key.account@coca-cola.com.mx"],
  ["LAB020202C45", "Lala Distribuidora",       "Diego Cardona", "+52 55 5566 4000", "key.cuenta@lala.com.mx"],
  ["SAB030303D67", "Sabritas SA de CV",        "Maria Tinoco",  "+52 55 9138 8800", "key@sabritas.com.mx"],
  ["OFM040404E89", "Office Depot Mexico",      "Luis Beltran",  "+52 55 1101 0400", "b2b@officedepot.com.mx"],
];

async function main() {
  console.log("> seeding products…");
  let pCreated = 0;
  for (const [sku, name, category, priceCents, stock, stockMin] of PRODUCTS) {
    const r = await prisma.product.upsert({
      where: { sku },
      update: {},
      create: { sku, name, category, priceCents, stock, stockMin }
    });
    if (r) pCreated++;
  }
  console.log(`✓ ${pCreated} products`);

  console.log("> seeding students…");
  let sCreated = 0;
  for (const [matricula, fullName, grade, gName, gEmail, gPhone, qrCode, balanceCents] of STUDENTS) {
    await prisma.student.upsert({
      where: { matricula },
      update: {},
      create: {
        matricula, fullName, grade,
        guardianName: gName, guardianEmail: gEmail, guardianPhone: gPhone,
        qrCode, balanceCents
      }
    });
    sCreated++;
  }
  console.log(`✓ ${sCreated} students`);

  console.log("> seeding suppliers…");
  let suCreated = 0;
  for (const [rfc, legalName, contactName, phone, email] of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { rfc },
      update: {},
      create: { rfc, legalName, contactName, phone, email }
    });
    suCreated++;
  }
  console.log(`✓ ${suCreated} suppliers`);

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
