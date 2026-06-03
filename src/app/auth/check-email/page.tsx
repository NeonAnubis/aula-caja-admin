import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Mail, Check } from "@/components/ui/icons";
import { resendConfirmation } from "@/app/register/actions";

export const metadata = { title: "Revisa tu email . Aula Caja" };

export default function CheckEmailPage({
  searchParams
}: {
  searchParams: { email?: string; resent?: string; error?: string };
}) {
  const email = searchParams.email ?? "tu email";
  const resent = searchParams.resent === "1";
  const error = searchParams.error;

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-white via-brand-50/30 to-accent-50/30 px-6">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-8 inline-flex"><Logo /></Link>

        <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-glow sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 text-white shadow-glow">
            <Mail className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Revisa tu bandeja de entrada
          </h1>
          <p className="mt-3 text-center text-ink-500">
            Enviamos un enlace de confirmación a{" "}
            <strong className="font-semibold text-ink-900">{email}</strong>.
            Ábrelo desde el mismo dispositivo para entrar al panel.
          </p>

          <ul className="mt-7 space-y-2 rounded-xl border border-ink-100 bg-ink-50/50 p-4 text-sm text-ink-600">
            {[
              "Busca un correo de noreply@mail.app.supabase.io",
              "Revisa la carpeta de spam si no aparece en 1 minuto",
              "El enlace expira en 24 horas"
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-none text-brand-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {resent && (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
              Listo, te reenviamos el correo de confirmación.
            </p>
          )}

          {error && (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {searchParams.email && (
            <form action={resendConfirmation} className="mt-6 flex flex-col gap-3">
              <input type="hidden" name="email" value={searchParams.email} />
              <button
                type="submit"
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-50"
              >
                Reenviar email de confirmación
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/register" className="font-semibold text-ink-700 hover:text-ink-900">
              ← Cambiar email
            </Link>
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Ya confirmé, iniciar sesión →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
