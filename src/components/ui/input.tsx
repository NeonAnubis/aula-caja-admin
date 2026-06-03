import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  /** Kept for backward compat with earlier API. shadcn-style ignores it. */
  variant?: "filled" | "outline";
  /** Light = use on white surfaces; dark = use on dark cards. */
  tone?: "light" | "dark";
}

/**
 * shadcn/ui-style Input.
 *
 *   - `h-10`, `rounded-md`, single `border`, `shadow-sm`
 *   - `text-sm`, light placeholder
 *   - clean 3-px focus ring at low opacity, no border-thickness change
 *   - icons live inside the input via absolute positioning
 *   - dark tone variant for use on dark cards (admin login dark background)
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      leftIcon,
      rightSlot,
      id,
      tone = "light",
      ...props
    },
    ref
  ) => {
    const reactId = React.useId();
    const fieldId = id ?? reactId;

    const wrap =
      tone === "dark"
        ? [
            "border-white/15 bg-white/[0.04] text-white shadow-none",
            "hover:border-white/25",
            "focus-visible:border-brand-400 focus-visible:ring-brand-400/40"
          ]
        : [
            "border-ink-200 bg-white text-ink-900 shadow-sm",
            "hover:border-ink-300",
            "focus-visible:border-brand-500 focus-visible:ring-brand-500/25"
          ];

    const placeholder =
      tone === "dark" ? "placeholder:text-white/40" : "placeholder:text-ink-400";

    const iconColor =
      tone === "dark"
        ? "text-white/55 peer-focus-visible:text-brand-300"
        : "text-ink-400 peer-focus-visible:text-brand-600";

    const labelColor =
      tone === "dark" ? "text-white" : "text-ink-900";
    const hintColor =
      tone === "dark" ? "text-white/55" : "text-ink-500";

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              "text-sm font-medium leading-none",
              labelColor
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            id={fieldId}
            ref={ref}
            className={cn(
              "peer flex h-10 w-full rounded-md border bg-transparent px-3 py-1",
              "text-sm transition-[color,box-shadow,border-color] outline-none",
              "focus-visible:ring-[3px]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              placeholder,
              ...wrap,
              leftIcon && "pl-9",
              rightSlot && "pr-9",
              error &&
                "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/25",
              className
            )}
            {...props}
          />
          {leftIcon && (
            <span
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
                iconColor
              )}
            >
              {leftIcon}
            </span>
          )}
          {rightSlot && (
            <span
              className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2",
                iconColor
              )}
            >
              {rightSlot}
            </span>
          )}
        </div>

        {(hint || error) && (
          <p
            className={cn(
              "text-xs leading-snug",
              error ? "font-medium text-red-600" : hintColor
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
