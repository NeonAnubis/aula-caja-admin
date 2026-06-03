import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/shell/sidebar";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Admin platform: every protected page requires ADMIN role.
  // Non-admins arriving here (e.g. via stale session cookie) get bounced.
  const session = await requireRole(
    ["ADMIN"],
    "/login?error=admin_required"
  );

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      <Sidebar
        user={{
          fullName: session.profile.fullName,
          email: session.email,
          role: session.profile.role
        }}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
