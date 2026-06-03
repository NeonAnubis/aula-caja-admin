"use client";

import { useState } from "react";

/**
 * Small chip that shows a student's tutor link code and copies it to the
 * clipboard on click. Staff read this off (or copy it) and hand it to the
 * parent, who enters it at /portal/link to connect their account.
 */
export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS); selecting still works.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Clic para copiar el código del tutor"
      className={
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs font-bold tracking-wider transition-colors " +
        (copied
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-ink-200 bg-ink-50 text-ink-800 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700")
      }
    >
      {code}
      {copied ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <path d="m5 12 5 5 9-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-60" fill="none">
          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
