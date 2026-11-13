import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const KEY_HEADER = "x-candlefair-key";

export function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

let warned = false;
function dmKey(): string | null {
  const key = process.env.DM_KEY;
  if (key) return key;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return null; // refuse everyone
  if (!warned) {
    console.warn("[candlefair] DM_KEY isn't set. Using the local-only key \"dev\".");
    warned = true;
  }
  return "dev";
}

export function isDmKey(key: string | null | undefined): boolean {
  const real = dmKey();
  if (!real || !key) return false;
  return sameHash(sha256(key), sha256(real));
}

export function keyMatches(key: string | null | undefined, hash: string | undefined): boolean {
  if (!hash) return true; // unlocked name
  if (!key) return false;
  return sameHash(sha256(key), hash);
}

const TOKEN_CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A private Arrival link code: 10 characters with no look-alikes (about 58 bits). */
export function makeToken(): string {
  let t = "";
  for (let i = 0; i < 10; i++) t += TOKEN_CHARS[randomInt(TOKEN_CHARS.length)];
  return t;
}
