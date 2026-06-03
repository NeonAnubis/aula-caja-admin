#!/usr/bin/env node
// Apply prisma/init.sql to the Supabase Postgres using the DIRECT_URL.
//
//   pnpm db:init  (or)  npm run db:init
//
// Idempotent: every statement uses `create or replace` / `drop policy if exists`.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DIRECT_URL;
  if (!url) {
    console.error("DIRECT_URL missing in env. Did you run via `dotenv -e .env.local --`?");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "..", "prisma", "init.sql");
  const sql = await readFile(sqlPath, "utf8");

  // Use pg directly (added as dep so this works without prisma rpc)
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

  console.log("> connecting to Postgres…");
  await client.connect();

  console.log("> applying prisma/init.sql (triggers, RLS, RPC functions)…");
  try {
    await client.query(sql);
    console.log("✓ init.sql applied successfully");
  } catch (err) {
    console.error("✗ init.sql failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
