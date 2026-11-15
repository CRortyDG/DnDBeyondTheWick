// Bulk import: monsters, Discovery entries and shop items from pasted text.
//
// One thing per "##" heading, then "key: value" lines. Keys are forgiving
// (any case, common spellings), pasted bullets are tidied, and a line that
// isn't a field is kept as a note, so nothing pasted is silently lost.
// Monsters also understand stat-block lines ("Armor Class 15 (leather armor)").
//
// The preview shows what each thing will be called in run sheets: Discovery
// slugs are made with the same uniqueSlug() the reducer uses, so an import and
// a hand-made entry with the same name get the same ref.

import { CATEGORY_IDS, KIND_IDS } from "./progress";
import { parseAmount } from "./money";
import { slugify, uniqueSlug } from "./discovery";
import type { Entry, EntryKind, Item, ItemCategory, ItemKind, ItemTier, MonsterAbility, MonsterAttack, MonsterTemplate, Shop, Stage } from "./types";

/** At most this many things in one import. */
export const IMPORT_MAX = 100;

export type ImportKind = "monsters" | "entries" | "items";

/** One thing to create, as the preview shows it. */
export interface ImportRow<T> {
  /** The line its "##" heading is on (1-based). */
  line: number;
  name: string;
  /** What it will be called in run sheets ("person/mags-wick", or a monster's name for fight: lines). */
  ref: string;
  /** Ready to create. Missing when it has errors or is a duplicate. */
  body?: T;
  errors: string[];
  warnings: string[];
  /** Already there: skipped. */
  duplicate?: boolean;
}

export interface ImportPlan<T> {
  rows: ImportRow<T>[];
  /** Lines outside any "##" block that weren't understood. */
  stray: string[];
  /** Shops the import will make (items only). */
  newShops: string[];
}

export interface MonsterBody {
  name: string;
  displayName: string;
  ac: number;
  hp: string;
  initBonus: number;
  speed: string;
  attacks: MonsterAttack[];
  abilities: Omit<MonsterAbility, "id">[];
  resist: string;
  immune: string;
  notes: string;
  dmNote: string;
}

export interface EntryBody {
  entry: { kind: EntryKind; name: string; title: string; summary: string; nickname: string; hint: string; areas: string[]; start?: Stage; dmNote: string; secrets: string; slug?: string };
  facts: string[];
}

export interface ItemBody {
  /** The shop's name, as typed (matched to an existing shop, or made). */
  shop: string;
  item: Pick<Item, "name" | "priceCp" | "description" | "tier" | "category" | "kind"> & Partial<Pick<Item, "stock" | "reason" | "hint" | "dmNote" | "installments">>;
}

// ---------------------------------------------------------------------------
// Blocks

interface Field {
  key: string;
  value: string;
  line: number;
}
interface Block {
  heading: string;
  line: number;
  fields: Field[];
  /** Lines that aren't fields. */
  loose: { text: string; line: number }[];
}

const BULLET = /^(?:[-*•–—]|\d+[.)])\s+/;
/** "Armor Class 15", "Hit Points 7 (2d6)": stat-block keys with no colon. */
const STAT_KEYS = /^(armou?r class|hit points|speed|damage resistances|damage immunities|condition immunities|challenge|senses|languages)\s+(.+)$/i;

function clean(line: string): string {
  return line
    .replace(/ /g, " ")
    .replace(/[​﻿]/g, "")
    .replace(/\s+$/, "");
}

/** Splits the text into "##" blocks. A "# Heading" line before or between them is a section (items use it for the shop). */
function blocks(text: string): { blocks: (Block & { section: string })[]; stray: string[] } {
  const out: (Block & { section: string })[] = [];
  const stray: string[] = [];
  let cur: (Block & { section: string }) | null = null;
  let section = "";
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = clean(raw);
    const n = i + 1;
    if (!line.trim()) return;
    const h2 = /^##\s+(.+)$/.exec(line.trim());
    if (h2) {
      cur = { heading: h2[1].trim(), line: n, fields: [], loose: [], section };
      out.push(cur);
      return;
    }
    const h1 = /^#\s+(.+)$/.exec(line.trim());
    if (h1) {
      section = h1[1].trim();
      cur = null;
      return;
    }
    const body = line.trim().replace(BULLET, "");
    const kv = /^([A-Za-z][A-Za-z .'/-]{0,30}?)\s*:\s*(.*)$/.exec(body) ?? STAT_KEYS.exec(body);
    if (!cur) {
      if (!/^#/.test(line.trim())) stray.push(`Line ${n}: “${body.slice(0, 60)}” is outside any “##” heading, so it was left out.`);
      return;
    }
    const c: Block = cur;
    if (kv) c.fields.push({ key: kv[1].trim().toLowerCase().replace(/\s+/g, " "), value: kv[2].trim(), line: n });
    else c.loose.push({ text: body, line: n });
  });
  return { blocks: out, stray };
}

const nameKey = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** "+4", "4", "-1" -> number. */
function signed(v: string): number | null {
  const m = /^([+\-−]?)\s*(\d{1,3})/.exec(v.trim());
  if (!m) return null;
  const n = Number(m[2]);
  return m[1] === "-" || m[1] === "−" ? -n : n;
}

// ---------------------------------------------------------------------------
// Monsters

const HP_RE = /^\s*(\d*d\d+\s*([+-]\s*\d+)?|\d+)\s*$/i;

/** "Fire Breath (Recharge 5–6)", "Healing Touch (1/Day)", "Death Burst (on death)". */
function abilityOf(name: string, text: string): Omit<MonsterAbility, "id"> {
  let n = name;
  const out: Omit<MonsterAbility, "id"> = { name: "", text: text.trim() };
  const rech = /\(\s*recharge\s*(\d)(?:\s*[-–—]\s*6)?\s*\)/i.exec(n);
  if (rech) {
    out.recharge = Math.min(6, Math.max(2, Number(rech[1])));
    n = n.replace(rech[0], "");
  }
  const uses = /\(\s*(\d)\s*\/\s*day\s*\)/i.exec(n);
  if (uses) {
    out.uses = Math.max(1, Math.min(9, Number(uses[1])));
    n = n.replace(uses[0], "");
  }
  const death = /\(\s*on death\s*\)/i.exec(n);
  if (death) {
    out.onDeath = true;
    n = n.replace(death[0], "");
  }
  out.name = n.replace(/[.:]\s*$/, "").trim();
  return out;
}

/** "Scimitar | +4 | 1d6+2", or a pasted "Scimitar. Melee Weapon Attack: +4 to hit, ... Hit: 5 (1d6 + 2) slashing damage." */
function attackOf(v: string): MonsterAttack | string {
  if (v.includes("|")) {
    const [name, bonus, damage] = v.split("|").map((x) => x.trim());
    const b = signed(bonus ?? "");
    if (!name) return "an attack needs a name";
    if (b === null) return `“${bonus ?? ""}” isn't a to-hit bonus like +4`;
    return { name, bonus: b, damage: damage ?? "" };
  }
  const hit = /([+-]\d+)\s*to hit/i.exec(v);
  const dmg = /hit:\s*\d*\s*\(([^)]+)\)\s*([a-z]+)?/i.exec(v) ?? /hit:\s*(\d+)\s*([a-z]+)?/i.exec(v);
  const name = v.split(/[.:]/)[0].trim();
  if (hit && name) return { name, bonus: Number(hit[1]), damage: dmg ? `${dmg[1].trim()}${dmg[2] ? ` ${dmg[2]}` : ""}` : "" };
  return "write attacks as Name | +4 | 1d6+2";
}

export function parseMonsters(text: string, existing: Pick<MonsterTemplate, "name">[]): ImportPlan<MonsterBody> {
  const { blocks: bs, stray } = blocks(text);
  const taken = new Set(existing.map((m) => nameKey(m.name)));
  const rows: ImportRow<MonsterBody>[] = [];
  for (const b of bs) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const m: MonsterBody = { name: b.heading.slice(0, 80), displayName: "", ac: 10, hp: "", initBonus: 0, speed: "", attacks: [], abilities: [], resist: "", immune: "", notes: "", dmNote: "" };
    let sawAc = false;
    let sawInit = false;
    const note = (t: string) => (m.notes = m.notes ? `${m.notes}\n${t}` : t);
    for (const f of b.fields) {
      const at = `Line ${f.line}`;
      switch (f.key) {
        case "tv":
        case "tv name":
        case "display":
        case "display name":
        case "shown as":
          m.displayName = f.value.slice(0, 80);
          break;
        case "ac":
        case "armor class":
        case "armour class": {
          const n = signed(f.value);
          if (n === null || n < 0 || n > 50) errors.push(`${at}: AC must be a number like 15.`);
          else {
            m.ac = n;
            sawAc = true;
          }
          break;
        }
        case "hp":
        case "hit points": {
          // "7 (2d6)": the dice roll each monster's HP; a plain number is fixed.
          const dice = /\(([^)]*d[^)]*)\)/i.exec(f.value);
          const v = (dice ? dice[1] : f.value).replace(/\s+/g, "");
          if (!HP_RE.test(v)) errors.push(`${at}: HP must be a number like 21 or dice like 6d6.`);
          else m.hp = v;
          break;
        }
        case "init":
        case "initiative":
        case "init bonus": {
          const n = signed(f.value);
          if (n === null || n < -10 || n > 20) errors.push(`${at}: initiative must be a bonus like +2.`);
          else {
            m.initBonus = n;
            sawInit = true;
          }
          break;
        }
        case "dex":
        case "dexterity": {
          if (sawInit) break;
          const mod = /\(([+\-−]?\d+)\)/.exec(f.value);
          const score = signed(f.value);
          if (mod) m.initBonus = signed(mod[1]) ?? 0;
          else if (score !== null) m.initBonus = Math.floor((score - 10) / 2);
          break;
        }
        case "speed":
          m.speed = f.value.replace(/\.$/, "").slice(0, 80);
          break;
        case "attack":
        case "attacks": {
          const a = attackOf(f.value);
          if (typeof a === "string") errors.push(`${at}: ${a}.`);
          else if (m.attacks.length >= 12) warnings.push(`${at}: only 12 attacks fit; this one was left out.`);
          else m.attacks.push({ name: a.name.slice(0, 80), bonus: a.bonus, damage: a.damage.slice(0, 80) });
          break;
        }
        case "ability":
        case "abilities":
        case "trait":
        case "action":
        case "reaction":
        case "legendary": {
          const [name, ...rest] = f.value.includes("|") ? f.value.split("|") : f.value.split(/\.\s+/);
          if (!name?.trim()) errors.push(`${at}: an ability needs a name.`);
          else if (m.abilities.length >= 16) warnings.push(`${at}: only 16 abilities fit; this one was left out.`);
          else {
            const ab = abilityOf(name.slice(0, 120), rest.join(f.value.includes("|") ? "|" : ". ").slice(0, 600));
            if (!ab.name) errors.push(`${at}: an ability needs a name.`);
            else m.abilities.push({ ...ab, name: ab.name.slice(0, 80) });
          }
          break;
        }
        case "resist":
        case "resists":
        case "resistance":
        case "resistances":
        case "damage resistances":
          m.resist = [m.resist, f.value].filter(Boolean).join("; ").slice(0, 200);
          break;
        case "immune":
        case "immunity":
        case "immunities":
        case "damage immunities":
        case "condition immunities":
          m.immune = [m.immune, f.value].filter(Boolean).join("; ").slice(0, 200);
          break;
        case "note":
        case "notes":
          note(f.value);
          break;
        case "dm":
        case "dm note":
        case "dm notes":
        case "secret":
          m.dmNote = [m.dmNote, f.value].filter(Boolean).join("\n").slice(0, 2000);
          break;
        default:
          note(`${f.key}: ${f.value}`);
          warnings.push(`${at}: “${f.key}” isn't a monster field; kept in its notes.`);
      }
    }
    for (const l of b.loose) {
      note(l.text);
      warnings.push(`Line ${l.line}: kept in its notes.`);
    }
    m.notes = m.notes.slice(0, 2000);
    if (!m.name.trim()) errors.push(`Line ${b.line}: a monster needs a name after “##”.`);
    if (!m.hp && !errors.some((x) => x.includes("HP must"))) errors.push(`Line ${b.line}: ${m.name || "this monster"} needs HP (hp: 7 or hp: 2d6).`);
    if (!sawAc && !errors.length) warnings.push(`Line ${b.line}: no AC given, so it's 10.`);
    const key = nameKey(m.name);
    const duplicate = taken.has(key);
    if (duplicate) warnings.push(`Line ${b.line}: there's already a monster called ${m.name}; skipped.`);
    taken.add(key);
    rows.push({ line: b.line, name: m.name, ref: m.name, errors, warnings, ...(duplicate ? { duplicate } : {}), ...(!errors.length && !duplicate ? { body: m } : {}) });
  }
  return capped({ rows, stray, newShops: [] });
}

// ---------------------------------------------------------------------------
// Discovery

const ENTRY_KINDS: Record<string, EntryKind> = {
  person: "person",
  people: "person",
  npc: "person",
  character: "person",
  place: "place",
  location: "place",
  area: "place",
  faction: "faction",
  group: "faction",
  guild: "faction",
  mystery: "mystery",
  secret: "mystery",
  clue: "mystery",
  item: "item",
  object: "item",
  artifact: "item",
};
const STAGE_WORDS: Record<string, Stage> = {
  hidden: "hidden",
  secret: "hidden",
  rumor: "rumored",
  rumored: "rumored",
  rumoured: "rumored",
  found: "found",
  met: "found",
  visited: "found",
  open: "found",
  known: "known",
};

export function parseEntries(text: string, existing: Pick<Entry, "id" | "kind" | "slug" | "name">[]): ImportPlan<EntryBody> {
  const { blocks: bs, stray } = blocks(text);
  // Slugs are worked out as the reducer would, one after another, so two "Mags" in one paste get mags and mags-2.
  const list = existing.map((e) => ({ ...e })) as Entry[];
  const rows: ImportRow<EntryBody>[] = [];
  for (const b of bs) {
    const errors: string[] = [];
    const warnings: string[] = [];
    let heading = b.heading;
    let kind: EntryKind | null = null;
    const head = /^([a-z]+)\s*[:/]\s*(.+)$/i.exec(heading);
    if (head && (ENTRY_KINDS[head[1].toLowerCase()] || /^(shop|monster)$/i.test(head[1]))) {
      if (/^(shop|monster)$/i.test(head[1])) errors.push(`Line ${b.line}: ${head[1].toLowerCase()}s come from the ${head[1].toLowerCase() === "shop" ? "Shop" : "Monsters"} page, not this import.`);
      kind = ENTRY_KINDS[head[1].toLowerCase()] ?? null;
      heading = head[2].trim();
    }
    const e: EntryBody["entry"] = { kind: kind ?? "person", name: heading.slice(0, 80), title: "", summary: "", nickname: "", hint: "", areas: [], dmNote: "", secrets: "" };
    const facts: string[] = [];
    const dm = (t: string) => (e.dmNote = e.dmNote ? `${e.dmNote}\n${t}` : t);
    for (const f of b.fields) {
      const at = `Line ${f.line}`;
      switch (f.key) {
        case "kind":
        case "type": {
          const k = ENTRY_KINDS[f.value.toLowerCase()];
          if (k) kind = e.kind = k;
          else errors.push(`${at}: “${f.value}” isn't a kind. Use person, place, faction, mystery or item.`);
          break;
        }
        case "title":
          e.title = f.value.slice(0, 120);
          break;
        case "summary":
        case "description":
        case "about":
          e.summary = [e.summary, f.value].filter(Boolean).join("\n").slice(0, 600);
          break;
        case "rumor":
        case "rumour":
        case "nickname":
        case "rumored as": {
          // "rumor: The woman with the lantern | Someone keeps a light burning." -> nickname | hint
          const [nick, ...hint] = f.value.split("|").map((x) => x.trim());
          e.nickname = (nick ?? "").slice(0, 80);
          if (hint.length) e.hint = hint.join(" | ").slice(0, 200);
          break;
        }
        case "hint":
          e.hint = f.value.slice(0, 200);
          break;
        case "start":
        case "starts":
        case "starts as":
        case "stage":
        case "starting stage": {
          const st = STAGE_WORDS[f.value.toLowerCase()];
          if (st) e.start = st;
          else errors.push(`${at}: “${f.value}” isn't a stage. Use hidden, rumored, found or known.`);
          break;
        }
        case "area":
        case "areas":
          e.areas = [...e.areas, ...f.value.split(",").map((x) => x.trim()).filter(Boolean)].slice(0, 8);
          break;
        case "fact":
        case "facts":
          if (f.value) facts.push(f.value.slice(0, 300));
          break;
        case "secret":
        case "secrets":
          e.secrets = [e.secrets, f.value].filter(Boolean).join("\n").slice(0, 4000);
          break;
        case "dm":
        case "dm note":
        case "dm notes":
        case "note":
        case "notes":
          dm(f.value);
          break;
        case "slug":
        case "ref":
        case "run sheet name":
          e.slug = slugify(f.value.replace(/^.*\//, "")).slice(0, 40);
          break;
        default:
          dm(`${f.key}: ${f.value}`);
          warnings.push(`${at}: “${f.key}” isn't a Discovery field; kept in the DM note.`);
      }
    }
    for (const l of b.loose) {
      dm(l.text);
      warnings.push(`Line ${l.line}: kept in the DM note.`);
    }
    e.dmNote = e.dmNote.slice(0, 4000);
    if (!kind && !errors.length) warnings.push(`Line ${b.line}: no kind given, so it's a person. Write “## place: ${e.name}” for a place.`);
    if (!e.name.trim()) errors.push(`Line ${b.line}: it needs a name after “##”.`);
    const duplicate = list.some((x) => x.kind === e.kind && nameKey(x.name) === nameKey(e.name));
    if (duplicate) warnings.push(`Line ${b.line}: ${e.name} is already in Discovery; skipped.`);
    const slug = uniqueSlug(list, e.kind, e.slug || e.name);
    if (!duplicate && !errors.length) list.push({ id: `new-${b.line}`, kind: e.kind, slug, name: e.name } as Entry);
    rows.push({ line: b.line, name: e.name, ref: `${e.kind}/${slug}`, errors, warnings, ...(duplicate ? { duplicate } : {}), ...(!errors.length && !duplicate ? { body: { entry: e, facts: facts.slice(0, 40) } } : {}) });
  }
  return capped({ rows, stray, newShops: [] });
}

// ---------------------------------------------------------------------------
// Shop items

const CATEGORY_WORDS: Record<string, ItemCategory> = {
  ...Object.fromEntries(CATEGORY_IDS.map((c) => [c, c])),
  equipment: "gear",
  weapons: "gear",
  weapon: "gear",
  armor: "gear",
  armour: "gear",
  potions: "healing",
  potion: "healing",
  heal: "healing",
  magic: "magic",
  magical: "magic",
  travel: "travel",
  transport: "travel",
  service: "services",
  build: "building",
  buildings: "building",
  "building candlefair": "building",
  trophy: "trophies",
};
const KIND_WORDS: Record<string, ItemKind> = {
  ...Object.fromEntries(KIND_IDS.map((k) => [k, k])),
  buy: "purchase",
  item: "purchase",
  rent: "recurring",
  rental: "recurring",
  monthly: "recurring",
  "special order": "order",
  "special-order": "order",
  lessons: "training",
  lesson: "training",
  pooled: "project",
  "pooled project": "project",
  fund: "project",
  reward: "earned",
};
const TIER_WORDS: Record<string, ItemTier> = {
  sale: "sale",
  "for sale": "sale",
  available: "sale",
  yes: "sale",
  locked: "locked",
  rumor: "rumored",
  rumored: "rumored",
  rumoured: "rumored",
  hidden: "hidden",
  no: "hidden",
};

/** defaultShop: the shop for items that don't name one (the shop open on the DM's page). */
export function parseItems(text: string, shops: Pick<Shop, "id" | "name">[], items: Pick<Item, "shopId" | "name">[], defaultShop = ""): ImportPlan<ItemBody> {
  const { blocks: bs, stray } = blocks(text);
  const shopByKey = new Map(shops.map((s) => [nameKey(s.name), s]));
  const taken = new Set(items.map((i) => `${i.shopId}|${nameKey(i.name)}`));
  const newShops: string[] = [];
  const rows: ImportRow<ItemBody>[] = [];
  for (const b of bs) {
    const errors: string[] = [];
    const warnings: string[] = [];
    let shop = b.section.replace(/^shop\s*:\s*/i, "").trim() || defaultShop.trim();
    const it: ItemBody["item"] = { name: b.heading.slice(0, 120), priceCp: 0, description: "", tier: "sale", category: "gear", kind: "purchase" };
    let sawPrice = false;
    const dm = (t: string) => (it.dmNote = it.dmNote ? `${it.dmNote}\n${t}` : t);
    for (const f of b.fields) {
      const at = `Line ${f.line}`;
      switch (f.key) {
        case "shop":
        case "store":
        case "sold at":
          shop = f.value.trim();
          break;
        case "category":
        case "tab": {
          const c = CATEGORY_WORDS[f.value.toLowerCase()];
          if (c) it.category = c;
          else errors.push(`${at}: “${f.value}” isn't a category. Use ${CATEGORY_IDS.join(", ")}.`);
          break;
        }
        case "kind":
        case "type": {
          const k = KIND_WORDS[f.value.toLowerCase()];
          if (k) it.kind = k;
          else errors.push(`${at}: “${f.value}” isn't a kind. Use ${KIND_IDS.join(", ")}.`);
          break;
        }
        case "price":
        case "cost":
        case "goal":
        case "rent": {
          const cp = parseAmount(f.value.replace(/\s*(each|per month|a month|\/\s*month)\s*$/i, ""));
          if (cp === null) errors.push(`${at}: “${f.value}” isn't a price like 50 gp or 5 sp.`);
          else {
            it.priceCp = cp;
            sawPrice = true;
          }
          break;
        }
        case "description":
        case "desc":
        case "about":
          it.description = [it.description, f.value].filter(Boolean).join("\n").slice(0, 600);
          break;
        case "availability":
        case "available":
        case "tier":
        case "status": {
          const t = TIER_WORDS[f.value.toLowerCase()];
          if (t) it.tier = t;
          else errors.push(`${at}: “${f.value}” isn't an availability. Use sale, locked, rumored or hidden.`);
          break;
        }
        case "stock": {
          if (/^(unlimited|any|none|-)$/i.test(f.value)) it.stock = null;
          else {
            const n = Number(f.value);
            if (!Number.isInteger(n) || n < 0 || n > 9999) errors.push(`${at}: stock must be a number, or “unlimited”.`);
            else it.stock = n;
          }
          break;
        }
        case "reason":
        case "locked because":
          it.reason = f.value.slice(0, 160);
          break;
        case "hint":
        case "rumor":
          it.hint = f.value.slice(0, 200);
          break;
        case "installments":
        case "parts":
        case "lessons": {
          const n = Number(f.value);
          if (!Number.isInteger(n) || n < 1 || n > 20) errors.push(`${at}: installments must be 1 to 20.`);
          else it.installments = n;
          break;
        }
        case "dm":
        case "dm note":
        case "dm notes":
        case "note":
        case "notes":
          dm(f.value);
          break;
        default:
          dm(`${f.key}: ${f.value}`);
          warnings.push(`${at}: “${f.key}” isn't an item field; kept in its DM note.`);
      }
    }
    for (const l of b.loose) {
      it.description = [it.description, l.text].filter(Boolean).join("\n").slice(0, 600);
      warnings.push(`Line ${l.line}: added to its description.`);
    }
    if (it.dmNote) it.dmNote = it.dmNote.slice(0, 2000);
    if (!it.name.trim()) errors.push(`Line ${b.line}: an item needs a name after “##”.`);
    if (!shop) errors.push(`Line ${b.line}: say which shop sells ${it.name || "it"} (shop: The Docks), or put “# The Docks” above it.`);
    if (!sawPrice && it.kind !== "earned") errors.push(`Line ${b.line}: ${it.name || "this item"} needs a price (price: 50 gp)${it.kind === "project" ? " or a goal" : ""}.`);
    const existingShop = shop ? shopByKey.get(nameKey(shop)) : undefined;
    if (shop && !existingShop && !newShops.some((s) => nameKey(s) === nameKey(shop))) newShops.push(shop.slice(0, 80));
    const key = `${existingShop?.id ?? `new:${nameKey(shop)}`}|${nameKey(it.name)}`;
    const duplicate = taken.has(key);
    if (duplicate) warnings.push(`Line ${b.line}: ${shop} already sells ${it.name}; skipped.`);
    taken.add(key);
    rows.push({ line: b.line, name: it.name, ref: shop ? `${shop} · ${it.name}` : it.name, errors, warnings, ...(duplicate ? { duplicate } : {}), ...(!errors.length && !duplicate ? { body: { shop: shop.slice(0, 80), item: it } } : {}) });
  }
  // Only shops something will actually be added to.
  const used = new Set(rows.filter((r) => r.body).map((r) => nameKey(r.body!.shop)));
  return capped({ rows, stray, newShops: newShops.filter((s) => used.has(nameKey(s))) });
}

function capped<T>(plan: ImportPlan<T>): ImportPlan<T> {
  let n = 0;
  for (const r of plan.rows) {
    if (!r.body) continue;
    if (++n > IMPORT_MAX) {
      delete r.body;
      r.errors.push(`Line ${r.line}: one import can add ${IMPORT_MAX} things. Import the rest next.`);
    }
  }
  return plan;
}

/** How many will be created. */
export const readyCount = <T>(p: ImportPlan<T>) => p.rows.filter((r) => r.body).length;

export const IMPORT_EXAMPLES: Record<ImportKind, string> = {
  monsters: `## Goblin
tv: Something in the bushes
ac: 15
hp: 2d6
init: +2
speed: 30 ft
attack: Scimitar | +4 | 1d6+2
ability: Nimble Escape | Disengage or Hide as a bonus action
dm: Flees at half HP`,
  entries: `## person: Mags Wick
title: Keeper of the Flickering Candle
summary: Runs the inn. Knows everyone.
rumor: The woman with the lantern | Someone keeps a light burning for travellers.
start: rumored
area: Candlefair
fact: She owes the baker money
secret: She was a smuggler`,
  items: `## Healing potion
shop: The Docks Stall
category: healing
kind: purchase
price: 50 gp
description: Heals 2d4+2.
availability: sale
stock: 3`,
};
