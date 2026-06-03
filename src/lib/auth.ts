import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Profile, UserRole } from "@prisma/client";

export type AuthSession = {
  userId: string;
  email: string;
  profile: Profile;
};

/**
 * Read the Supabase session and the matching profile row from Prisma.
 * Returns null when no session or profile yet (e.g. just-confirmed user
 * whose trigger may not have fired in a flaky environment).
 */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  let profile = await prisma.profile.findUnique({ where: { id: user.id } });

  // Defensive: if the trigger somehow didn't fire, create the row here.
  if (!profile) {
    profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email ?? `${user.id}@unknown.local`,
        fullName:
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          null,
        role: "CASHIER"
      }
    });
  }

  return { userId: user.id, email: user.email ?? profile.email, profile };
}

export async function requireUser(): Promise<AuthSession> {
  const s = await getSession();
  if (!s) redirect("/login?next=/dashboard");
  return s;
}

export async function requireRole(
  roles: UserRole[],
  redirectTo = "/dashboard?error=forbidden"
): Promise<AuthSession> {
  const s = await requireUser();
  if (!roles.includes(s.profile.role)) redirect(redirectTo);
  return s;
}
