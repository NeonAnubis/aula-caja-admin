/**
 * Short, human-readable codes used for student ↔ tutor linking.
 *
 * Eight characters from a base-32 alphabet with the easily-confused
 * characters (0, O, 1, I, L) removed. ~10^12 combinations — collision
 * resistant for any realistic single-school deployment, and short enough
 * for a parent to read off a paper card.
 */

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateLinkCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Normalize input: strip whitespace, uppercase, allowed-chars only. */
export function normalizeLinkCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, "")
    .split("")
    .filter((c) => ALPHABET.includes(c))
    .join("");
}
