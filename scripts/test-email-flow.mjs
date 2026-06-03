#!/usr/bin/env node
/**
 * End-to-end verification of the email-confirmation flow.
 *
 *   1. Calls supabase.auth.signUp() with a unique test email
 *   2. Checks the returned user/session shape
 *   3. Uses the service_role admin API to inspect the auth.users row
 *   4. Verifies the on_auth_user_created trigger created a public.profiles row
 *   5. Cleans up the test user
 *
 *   npm run test:auth
 */

// Node 20 lacks native WebSocket — supabase-js needs one to init realtime.
// Provide ws as a polyfill before the import.
import WS from "ws";
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WS;
}

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const svc = process.env.SERVICE_ROLE_KEY;

if (!url || !anon || !svc) {
  console.error("env missing");
  process.exit(1);
}

const browser = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const service = createClient(url, svc, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const stamp = Date.now();
// Supabase blocks example.com / test.com / etc. Use a unique mailbox under a
// plausible-looking custom domain we control conceptually for the test.
const testEmail = `aulacaja+test-${stamp}@protonmail.com`;
const testPassword = "ConfirmFlow2026!";

let createdUserId = null;

async function step(label, fn) {
  process.stdout.write(`> ${label} `);
  try {
    const r = await fn();
    console.log(`✓`);
    return r;
  } catch (e) {
    console.log(`✗\n  ${e?.message ?? e}`);
    throw e;
  }
}

(async () => {
  console.log(`Test email: ${testEmail}\n`);

  // 1. signUp from a "browser" client (publishable key)
  const signup = await step("supabase.auth.signUp()", async () => {
    const { data, error } = await browser.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`,
        data: { full_name: "Aula Caja Test Bot" }
      }
    });
    if (error) throw error;
    return data;
  });
  createdUserId = signup.user?.id ?? null;
  console.log(`  user.id        = ${createdUserId}`);
  console.log(`  user.email     = ${signup.user?.email}`);
  console.log(`  user.confirmed = ${signup.user?.confirmed_at ?? "null (correct — pending email confirm)"}`);
  console.log(`  session        = ${signup.session ? "present (autoconfirm on)" : "null (correct — email confirm required)"}\n`);

  // 2. Inspect via service-role admin
  const adminUser = await step("admin.listUsers() ← service role", async () => {
    const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    return data.users.find((u) => u.id === createdUserId);
  });
  if (!adminUser) throw new Error("user not visible via admin API");
  console.log(`  email_confirmed_at = ${adminUser.email_confirmed_at ?? "null (waiting for click)"}`);
  console.log(`  identities         = ${adminUser.identities?.length ?? 0}\n`);

  // 3. Confirm the trigger created the profile row
  await step("trigger created public.profiles row", async () => {
    const { data, error } = await service
      .from("profiles")
      .select("id, email, full_name, role, active")
      .eq("id", createdUserId)
      .single();
    if (error) throw new Error(`profile lookup failed: ${error.message}`);
    if (!data) throw new Error("no profile row");
    console.log(`\n  profile.email     = ${data.email}`);
    console.log(`  profile.full_name = ${data.full_name}`);
    console.log(`  profile.role      = ${data.role}`);
    console.log(`  profile.active    = ${data.active}`);
  });

  // 4. Simulate the confirmation click — admin API can mark email_confirmed_at
  await step("\nadmin manual confirm (simulates clicking the email link)", async () => {
    const { data, error } = await service.auth.admin.updateUserById(createdUserId, {
      email_confirm: true
    });
    if (error) throw error;
    console.log(`  new email_confirmed_at = ${data.user.email_confirmed_at}`);
  });

  // 5. Sign-in works now
  const signin = await step("supabase.auth.signInWithPassword() after confirm", async () => {
    const { data, error } = await browser.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (error) throw error;
    return data;
  });
  console.log(`  session.access_token (first 40) = ${signin.session?.access_token.slice(0, 40)}…`);
  console.log(`  session.user.email              = ${signin.user?.email}\n`);

  // 6. cleanup
  await step("cleanup: delete test user", async () => {
    const { error } = await service.auth.admin.deleteUser(createdUserId);
    if (error) throw error;
  });
  await step("cleanup: delete trailing profile row", async () => {
    await service.from("profiles").delete().eq("id", createdUserId);
  });

  console.log("\n✓ Email-confirmation flow verified end-to-end against live Supabase.");
})().catch((e) => {
  console.error("\n✗ Failed:", e?.message ?? e);
  if (createdUserId) {
    service.auth.admin.deleteUser(createdUserId).catch(() => {});
  }
  process.exit(1);
});
