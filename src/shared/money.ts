// All money is stored as integer copper pieces.
// 1 gp = 100 cp, 1 sp = 10 cp. pp and ep are accepted when parsing.

export const CP = 1;
export const SP = 10;
export const EP = 50;
export const GP = 100;
export const PP = 1000;

const MINUS = "−"; // a real minus sign, not a hyphen

/** "12 gp 5 sp 3 cp". Zero is "0 gp". Negative amounts start with a minus sign. */
export function formatCp(cp: number): string {
  if (!Number.isFinite(cp)) return "0 gp";
  let n = Math.round(cp);
  const neg = n < 0;
  n = Math.abs(n);
  const g = Math.floor(n / GP);
  const s = Math.floor((n % GP) / SP);
  const c = n % SP;
  const parts: string[] = [];
  if (g) parts.push(`${g.toLocaleString("en-US")} gp`);
  if (s) parts.push(`${s} sp`);
  if (c) parts.push(`${c} cp`);
  return (neg ? MINUS : "") + (parts.join(" ") || "0 gp");
}

/** "+25 gp" / "−1 gp" for floats and ledger lines. */
export function formatDelta(cp: number): string {
  if (cp > 0) return "+" + formatCp(cp);
  return formatCp(cp);
}

const UNIT: Record<string, number> = { pp: PP, gp: GP, ep: EP, sp: SP, cp: CP, p: PP, g: GP, e: EP, s: SP, c: CP };

/**
 * Parse what a DM types into copper.
 *   "25"        -> 2500  (a bare number is gold)
 *   "2.5"       -> 250
 *   "12 gp 5 sp"-> 1250
 *   "3sp 4cp"   -> 34
 *   "1,500 gp"  -> 150000
 * Returns null if the text isn't a non-negative amount.
 */
export function parseAmount(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/,/g, "");
  if (!text) return null;
  if (/^\d+(\.\d+)?$/.test(text)) {
    const v = Math.round(parseFloat(text) * GP);
    return Number.isSafeInteger(v) ? v : null;
  }
  const re = /(\d+(?:\.\d+)?)\s*(pp|gp|ep|sp|cp|p|g|e|s|c)\b/g;
  let total = 0;
  let consumed = "";
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    total += parseFloat(m[1]) * UNIT[m[2]];
    consumed += m[0];
  }
  // Everything that isn't whitespace must have been part of an amount.
  if (consumed.replace(/\s/g, "") !== text.replace(/\s/g, "")) return null;
  const v = Math.round(total);
  return Number.isSafeInteger(v) ? v : null;
}

/** Value for a gp number input (prototype-compatible): 1250 -> "12.5". */
export function cpToGpInput(cp: number): string {
  return String(Math.round(cp) / GP);
}

export function canAfford(balanceCp: number, priceCp: number): boolean {
  return balanceCp >= priceCp;
}
