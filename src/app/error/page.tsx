import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  searchParams
}: {
  searchParams: { message?: string };
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50/50 px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">
          Something went sideways.
        </h1>
        <p className="mt-3 text-ink-500">
          {searchParams.message ??
            "An unexpected error occurred. Try again or head back to the homepage."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/">
            <Button variant="outline">Back home</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
