import * as React from "react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  withWordmark = true,
  variant = "light"
}: {
  className?: string;
  withWordmark?: boolean;
  variant?: "light" | "dark";
}) {
  const wordmarkColor = variant === "dark" ? "text-white" : "text-ink-900";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-ink-900 shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <defs>
            <linearGradient id="ac-logo-g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset="0.6" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/* school store glyph: shopping bag + slash */}
          <path
            d="M6 8h12l-1 11.5a1.5 1.5 0 0 1-1.5 1.4h-9A1.5 1.5 0 0 1 5 19.5L6 8Z"
            fill="url(#ac-logo-g)"
          />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>
      {withWordmark && (
        <span className={cn("text-lg font-bold tracking-tight", wordmarkColor)}>
          Aula <span className="text-brand-400">Caja</span>
        </span>
      )}
    </span>
  );
}
