import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-soft",
  secondary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-blue",
  ghost:
    "bg-transparent text-ink-700 hover:bg-ink-100 active:bg-ink-200",
  outline:
    "bg-white text-ink-900 border-2 border-ink-200 hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100"
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-sm rounded-xl",
  md: "h-12 px-5 text-sm rounded-2xl",
  lg: "h-14 px-7 text-base rounded-2xl"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2",
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
              <path
                d="M21 12a9 9 0 0 1-9 9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <span>Working</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
