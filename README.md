# Aula Caja . POS escolar

Production-grade POS for school stores (tienda escolar). Implements the six
modules from Yurico's brief — Portal de carga de saldo, Cobro con saldo,
Inventario, Compras, Tesorería, Reporte de Ventas — on a Next.js 14 +
Supabase + Prisma stack.

Built to be deployed and used, not as a demo.

## Stack

| Layer        | Choice                                                              |
|--------------|---------------------------------------------------------------------|
| Framework    | Next.js 14.2 (App Router, Server Actions, RSC, Edge middleware)     |
| Language     | TypeScript 5.6 strict                                               |
| Style        | Tailwind CSS 3.4 with custom `ink`, `brand`, `accent` tokens        |
| Auth         | Supabase Auth via `@supabase/ssr` (PKCE flow, email confirmation)   |
| Database     | Supabase Postgres (shared transaction pooler at runtime)            |
| ORM          | Prisma 5.22 with `@map`/`@@map` for snake-case in Postgres          |
| Tx integrity | Postgres `SECURITY DEFINER` functions for `record_sale` & `record_recharge` |
| RLS          | Row-Level Security on every table, role check via `current_user_role()` |

## How the database is laid out

```
prisma/
├── schema.prisma      Prisma model (10 tables, 5 enums)
└── init.sql           Triggers + RLS + RPC functions (run after `db push`)
```

Tables: `profiles`, `students`, `products`, `sales`, `sale_items`, `recharges`,
`treasury_movements`, `suppliers`, `purchase_orders`, `purchase_order_items`.

The atomic flows live as `record_sale(...)` and `record_recharge(...)` Postgres
functions. The Node side **never multi-step writes** for sales or recharges —
it calls the RPC, which locks rows (`SELECT ... FOR UPDATE`), checks stock /
balance, decrements, inserts the sale + items + treasury movement, and either
commits or rolls back. No partial writes possible.

## Setup (one time)

```bash
cd pos_escolar_app
cp .env.example .env.local   # fill in your Supabase keys
npm install
```

```bash
npm run db:push   # creates the 10 tables + enums via Prisma
npm run db:init   # applies triggers + RLS + record_sale/record_recharge RPCs
npm run db:seed   # 24 products + 10 students + 5 suppliers (idempotent)
```

```bash
npm run test:auth # verifies signup + email confirmation flow end-to-end
npm run dev       # http://localhost:3000
```

## Verifying connection + email confirmation

Two surfaces let you confirm everything is healthy.

### `/setup`

A server-rendered page that runs 7 checks against the live Supabase project:

1. Env vars present
2. `${SUPABASE_URL}/auth/v1/health` returns 200
3. `prisma.$queryRaw` executes `select 1` (Postgres reachable)
4. Prisma model deployed (counts profiles/products/students/suppliers)
5. The 5 expected SQL functions exist in `public` (init.sql applied)
6. Service-role key works against `admin.listUsers`
7. Cookie-based SSR session reads cleanly

Each row shows OK / hint, plus the env summary at the bottom.

### `npm run test:auth`

A standalone Node script that exercises the full email-confirmation flow
against the live Supabase project — no UI involved. Sample output:

```
> supabase.auth.signUp() ✓
  user.confirmed = null (correct — pending email confirm)
  session        = null (correct — email confirm required)

> admin.listUsers() ← service role ✓
  email_confirmed_at = null (waiting for click)

> trigger created public.profiles row ✓
  profile.email     = aulacaja+test-…@protonmail.com
  profile.full_name = Aula Caja Test Bot
  profile.role      = ADMIN
  profile.active    = true

> admin manual confirm (simulates clicking the email link) ✓
> supabase.auth.signInWithPassword() after confirm ✓

✓ Email-confirmation flow verified end-to-end against live Supabase.
```

It also cleans up the test user when done.

## Auth UX

| Path                      | Behavior                                                      |
|---------------------------|---------------------------------------------------------------|
| `/register`               | Form with full name + email + password. On success, redirects to `/auth/check-email` with the email pre-filled. |
| `/auth/check-email`       | "Revisa tu bandeja". Button to resend the confirmation email. |
| `/auth/callback?code=...` | Route handler. Calls `exchangeCodeForSession(code)`, sets the cookie, redirects to `/dashboard`. |
| `/login`                  | If Supabase returns "Email not confirmed", surfaces a direct link back to `/auth/check-email`. |
| `/api/auth/signout`       | POST endpoint hit by the sidebar form. Clears cookies + redirects to `/`. |

`src/middleware.ts` refreshes the session on every request and gates the eight
protected route prefixes (`/dashboard`, `/pos`, `/estudiantes`, `/inventario`,
`/recargas`, `/compras`, `/tesoreria`, `/ventas`). Unauthenticated users are
sent to `/login?next=...`; authenticated users hitting `/login` or `/register`
are sent to `/dashboard`.

## Module map

| Path             | What it does                                                                     |
|------------------|----------------------------------------------------------------------------------|
| `/dashboard`     | KPIs hoy (ventas, recargas, saldo cargado total, stock bajo), últimas 8 ventas + alertas |
| `/pos`           | Cobro POS — buscador, categorías, lookup de alumno (QR/matrícula/nombre), carrito, cobro con saldo / efectivo / tarjeta. Llama a `record_sale` RPC. |
| `/estudiantes`   | Padrón con búsqueda + alta de alumno                                             |
| `/inventario`    | Catálogo con búsqueda + filtros + alta de producto                               |
| `/recargas`      | Formulario de recarga manual + listado de las últimas 30 recargas. Llama a `record_recharge` RPC. |
| `/compras`       | Proveedores activos + órdenes de compra recientes (read-only por ahora)          |
| `/tesoreria`     | Ingresos / egresos / neto hoy, saldo neto por cuenta, últimos 30 movimientos     |
| `/ventas`        | Reporte: KPIs hoy/7d/total, mezcla de pago, top 5 productos, últimas 25 ventas   |
| `/setup`         | Verificación del sistema (descrita arriba)                                       |

## Files of interest

```
src/
├── middleware.ts                       protects 8 route prefixes
├── lib/
│   ├── auth.ts                         requireUser() / requireRole()
│   ├── prisma.ts                       singleton Prisma client
│   ├── format.ts                       mxn(), dateShort(), genFolio()
│   ├── utils.ts                        cn(), initials(), getAppUrl()
│   └── supabase/
│       ├── client.ts                   createBrowserClient (publishable key)
│       ├── server.ts                   createServerClient + createServiceClient
│       └── middleware.ts               session refresh + route gating
├── app/
│   ├── page.tsx                        landing (POS-themed)
│   ├── login/                          login flow
│   ├── register/                       register flow
│   ├── auth/
│   │   ├── callback/route.ts           exchangeCodeForSession
│   │   └── check-email/page.tsx        "revisa tu email" + resend
│   ├── setup/page.tsx                  7-check connection verifier
│   ├── api/auth/signout/route.ts       POST signout
│   └── (app)/                          protected shell (sidebar layout)
│       ├── layout.tsx                  requireUser + Sidebar
│       ├── dashboard/page.tsx
│       ├── pos/                        page + pos-client + actions
│       ├── estudiantes/                page + new-student-form + actions
│       ├── inventario/                 page + new-product-form + actions
│       ├── recargas/                   page + recharge-form + actions
│       ├── compras/page.tsx
│       ├── tesoreria/page.tsx
│       └── ventas/page.tsx
├── components/
│   ├── ui/                             Button, Input, Card, Logo, Icons
│   └── shell/sidebar.tsx               protected nav
prisma/
├── schema.prisma
└── init.sql                            triggers, RLS, record_sale, record_recharge
scripts/
├── apply-init-sql.mjs                  run by `npm run db:init`
├── seed.mjs                            run by `npm run db:seed`
└── test-email-flow.mjs                 run by `npm run test:auth`
```

## Security notes

- `SERVICE_ROLE_KEY` and `JWT_SECRET_KEY` are **server-only**, read from
  `.env.local` (in `.gitignore`). The browser client only ever sees
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Every Postgres table has RLS enabled. The two RPC functions are
  `SECURITY DEFINER`, so they run under the function owner's permissions —
  this is how we let cashier actions write while keeping RLS strict for
  ordinary clients.
- The service-role client is lazy-loaded inside `createServiceClient()` so
  the Next.js bundle never includes it in the browser graph.
- **Rotate the keys you pasted in chat** before this hits anything you care
  about — Supabase Dashboard → Settings → API → "Reset".

## Scripts

| Command            | Action                                                       |
|--------------------|--------------------------------------------------------------|
| `npm run dev`      | Start the Next.js dev server                                 |
| `npm run build`    | Generate Prisma client + build for production                |
| `npm run start`    | Serve the production build                                   |
| `npm run typecheck`| `tsc --noEmit`                                               |
| `npm run lint`     | `next lint`                                                  |
| `npm run db:push`  | Push the Prisma schema to Supabase Postgres                  |
| `npm run db:init`  | Apply `prisma/init.sql` (triggers, RLS, RPCs)                |
| `npm run db:seed`  | Seed 24 products + 10 students + 5 suppliers                 |
| `npm run db:studio`| Open Prisma Studio (visual DB browser)                       |
| `npm run test:auth`| Verify email confirmation flow against live Supabase         |

## Known limitations (next steps)

- **OXXO / SPEI / Mercado Pago integration** — the schema and recharge flow
  are ready; the actual gateway webhooks (Conekta `charge.paid` etc.) are
  the next milestone.
- **CFDI emission** — pending Facturama integration. The `sales` table
  already snapshots everything needed.
- **Purchase order creation UI** — read-only today; the schema + relations
  are in place.
- **Realtime updates** — current pages are server-rendered with
  `dynamic = "force-dynamic"`. Adding Supabase Realtime subscriptions for
  the cashier dashboard would be a low-cost upgrade.
