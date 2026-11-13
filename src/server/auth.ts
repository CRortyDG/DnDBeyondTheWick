import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const KEY_HEADER = "x-candlefair-key";

export function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A new campaign's DM key: 24 random bytes, URL-safe. Only its hash is stored. */
export function newDmKey(): string {
  return randomBytes(24).toString("base64url");
}

/** Is this the campaign's DM key? A campaign with no key set lets nobody in. */
export function isDmKey(key: string | null | undefined, hash: string | null | undefined): boolean {
  if (!key || !hash) return false;
  return sameHash(sha256(key), hash);
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

const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

/** A new campaign code: 7 lowercase characters with no look-alikes, easy to read aloud or type. */
export function makeCampaignCode(): string {
  let t = "";
  for (let i = 0; i < 7; i++) t += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return t;
}
