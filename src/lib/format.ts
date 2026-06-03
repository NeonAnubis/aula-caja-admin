/** Cents → "$ 1,234.50" (Mexican peso) */
export function mxn(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const formatted = (abs / 100).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${sign}$ ${formatted}`;
}

/** "$ 1,234.50" → 123450 cents */
export function parseMxn(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function dateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short"
  });
}

export function dateTimeShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const FOLIO_RX = /^[A-Z]+-\d{4}-\d{6}$/;

/** Generate a folio like "SALE-2026-000001" */
export function genFolio(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(6, "0");
  const folio = `${prefix}-${year}-${seq}`;
  if (!FOLIO_RX.test(folio)) throw new Error(`bad folio: ${folio}`);
  return folio;
}
