// Run sheets: episodes as Markdown, in and out. DM-only data (see types.ts).
//
// One beat per "##". Recognised line prefixes:
//   >        read-aloud (a bare ">" is a paragraph break)
//   -        DM note (also *, •, – bullets from pasted docs)
//   check:   <skill> DC <n> | <what> | fail: ... | success: ...
//   if:      <when> → <then>   (-> and => work too)
//   story:   sb-id — Title   (a story beat placed here; indented fact: lines under it reveal when you tick it)
//   show:    <ref or name>   (person/mags, map/candlefair/3, prop/the-symbol, black...: see assets.ts)
//   action:  scene <name> | black | bank | stinger   ("action: scene X" is the old spelling of "show: X")
//   fight:   <monster> x<n>, <monster>   (sets up a fight from the monster templates)
//   reveal:  <kind>/<name> [rumored|found|known]   (Discovery: moves it forward, never back; found by default)
//   rumor:   <kind>/<name>   (the same as "reveal: <kind>/<name> rumored")
//   fact:    <kind>/<name>/<fact>   (reveals that fact)
//   sound:   <mix or layer> | off   (crossfades the TV's soundboard: "sound: busy tavern", "sound: night crickets", "sound: layer/rain")
//   sfx:     <one-shot>   (plays it on the TV: "sfx: war horn")
//            add "(tap)" to either for a button on the beat instead of playing on landing: "sfx: roar (tap)"
// Anything else becomes a note, so nothing pasted is silently lost.

import { fightLineMarkdown, parseFightLine } from "./combat";
import type { Beat, BeatAction, BeatCheck, Episode, GameState, Scene, Stage, StoryBlock } from "./types";
import { FACT_REF_RE, REF_RE } from "./discovery";
import { actionRef, listAssets, resolveRef, SHOW_REF_RE, type AssetGame } from "./assets";
import { findMix, findSfx } from "./sound";

export interface ParsedEpisode {
  title: string;
  beats: Omit<Beat, "id">[];
  warnings: string[];
}

/** Turns a name in a run sheet into what it shows: a ref, or (for the seed, before entries exist) a scene id. */
export type SceneResolver = (name: string) => Extract<BeatAction, { type: "show" | "scene" }> | null;

/** Lowercase, straight apostrophes, no leading "the", single spaces. */
export function sceneKey(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the /, "");
}

/** Match a scene by its label (exact after normalising), then by caption name. */
export function sceneResolver(scenes: Pick<Scene, "id" | "label" | "name" | "kind">[]): SceneResolver {
  return (name) => {
    const k = sceneKey(name);
    if (!k) return null;
    const hit = scenes.find((s) => sceneKey(s.label) === k) ?? scenes.find((s) => s.name && sceneKey(s.name) === k);
    return hit ? { type: "scene", sceneId: hit.id } : null;
  };
}

/** Match a ref as written ("person/mags"), then anything the DM can show by its name ("Mags Wick", "The symbol", "Candlefair map"). */
export function assetResolver(g: AssetGame): SceneResolver {
  const all = listAssets(g);
  return (name) => {
    const raw = name.trim().toLowerCase();
    if (SHOW_REF_RE.test(raw)) {
      const a = resolveRef(g, raw);
      if (a) return { type: "show", ref: a.ref };
    }
    const k = sceneKey(name);
    if (!k) return null;
    const hit =
      all.find((a) => sceneKey(a.label) === k) ??
      all.find((a) => a.entry && a.entry.nickname && sceneKey(a.entry.nickname) === k) ??
      all.find((a) => a.scene && (sceneKey(a.scene.label) === k || (a.scene.name && sceneKey(a.scene.name) === k))) ??
      all.find((a) => a.pin && sceneKey(a.pin.name) === k);
    return hit ? { type: "show", ref: hit.ref } : null;
  };
}

const BULLET = /^(?:[-*•–—]|\d+[.)])\s+/;
const ARROW = /\s*(?:→|->|=>|⇒)\s*/;

function clean(line: string): string {
  return line
    .replace(/ /g, " ")
    .replace(/[​﻿]/g, "")
    .replace(/\s+$/, "");
}

/** "roar (tap)" -> a button on the beat rather than playing on landing. */
function tapped(v: string): { name: string; tap: boolean } {
  const m = /^(.*?)\s*\(\s*(?:tap|button|on tap)\s*\)\s*$/i.exec(v);
  return m ? { name: m[1], tap: true } : { name: v, tap: false };
}

function prefixed(line: string, word: string): string | null {
  const m = new RegExp(`^${word}\\s*:\\s*`, "i").exec(line);
  return m ? line.slice(m[0].length).trim() : null;
}

export function parseCheck(body: string): BeatCheck | null {
  const parts = body.split("|").map((x) => x.trim());
  const head = /^(.*?)\s*\bDC\s*:?\s*(\d+)\s*$/i.exec(parts[0] ?? "");
  if (!head || !head[1]) return null;
  const check: BeatCheck = { skill: head[1].trim(), dc: Number(head[2]), what: "" };
  for (const p of parts.slice(1)) {
    if (!p) continue;
    const fail = prefixed(p, "fail(?:ure)?");
    const success = prefixed(p, "success");
    if (fail !== null) check.fail = fail;
    else if (success !== null) check.success = success;
    else check.what = check.what ? `${check.what} | ${p}` : p;
  }
  return check;
}

/** Turns "sb-lucky" or a story beat's title into its id. */
export type StoryResolver = (text: string) => string | null;

export function storyResolver(g: Partial<Pick<GameState, "story">>): StoryResolver {
  const beats = g.story?.beats ?? [];
  return (text) => {
    const t = text.trim();
    const id = t.split(/\s+/)[0];
    const byId = beats.find((b) => b.id === id);
    if (byId) return byId.id;
    const title = sceneKey(t.replace(/^[^\s]+\s+[—–-]\s+/, ""));
    return beats.find((b) => sceneKey(b.title) === title || sceneKey(b.title) === sceneKey(t))?.id ?? null;
  };
}

export function parseEpisode(markdown: string, resolve: SceneResolver, fallbackTitle = "New episode", story?: StoryResolver): ParsedEpisode {
  const warnings: string[] = [];
  // Indented fact:/reveal: lines right under a "story:" line are the story beat's own (shown, not fired).
  let inStory = false;
  const beats: Omit<Beat, "id">[] = [];
  let title = "";
  let cur: Omit<Beat, "id"> | null = null;
  // Read-aloud lines collect into paragraphs; a bare ">" or a blank line ends one.
  let para: string[] = [];
  let inRead = false;
  let preamble = 0;

  const flushPara = () => {
    if (cur && para.length) {
      if (cur.readAloud === undefined) {
        cur.readAloud = [];
        cur.readAloudAt = cur.notes.length;
      }
      cur.readAloud.push(para.join(" "));
    }
    para = [];
  };

  for (const raw of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const line = clean(raw).trim();
    if (inStory && /^\s+/.test(raw) && /^(fact|reveal|rumor)\s*:/i.test(line)) continue;
    inStory = false;
    const read = /^>\s?(.*)$/.exec(line);
    if (read) {
      if (!cur) {
        preamble++;
        continue;
      }
      inRead = true;
      const t = read[1].trim();
      if (t) para.push(t);
      else flushPara();
      continue;
    }
    if (inRead) {
      flushPara();
      inRead = false;
    }
    if (!line) continue;

    const h = /^(#{1,6})\s*(.*)$/.exec(line);
    if (h && h[1].length !== 2) {
      // "# Episode title" before the first beat; deeper headings are just notes.
      if (h[1].length === 1 && !cur && !title) title = h[2].trim();
      else if (cur && h[2].trim()) cur.notes.push(h[2].trim());
      continue;
    }
    if (h) {
      cur = { title: h[2].trim() || `Beat ${beats.length + 1}`, notes: [], checks: [], branches: [], actions: [] };
      beats.push(cur);
      continue;
    }
    if (!cur) {
      preamble++;
      continue;
    }
    const where = `“${cur.title}”`;

    let v: string | null;
    if ((v = prefixed(line, "story")) !== null) {
      inStory = true;
      const id = story?.(v) ?? null;
      if (!id) warnings.push(`${where}: no story beat called “${v}”, so “story: ${v}” was left off.`);
      else if (!(cur.stories ??= []).some((x) => x.storyBeatId === id)) cur.stories.push({ storyBeatId: id });
    } else if ((v = prefixed(line, "check")) !== null) {
      const c = parseCheck(v);
      if (c) cur.checks.push(c);
      else {
        warnings.push(`${where}: couldn't find a DC in “check: ${v}”, so it's kept as a note.`);
        cur.notes.push(`Check: ${v}`);
      }
    } else if ((v = prefixed(line, "if")) !== null) {
      const [when, ...rest] = v.split(ARROW);
      cur.branches.push({ when: when.trim(), then: rest.join(" → ").trim() });
    } else if ((v = prefixed(line, "fight")) !== null) {
      const monsters = parseFightLine(v);
      if (monsters.length) cur.actions.push({ type: "fight", monsters });
      else warnings.push(`${where}: “fight:” needs at least one monster, like “fight: Goblin x2”.`);
    } else if ((v = prefixed(line, "reveal")) !== null || (v = prefixed(line, "rumor")) !== null) {
      const rumor = prefixed(line, "rumor") !== null;
      const [ref = "", st = ""] = v.trim().toLowerCase().split(/\s+/);
      const stage = rumor ? "rumored" : st === "" || st === "met" || st === "visited" ? "found" : st;
      if (!REF_RE.test(ref)) warnings.push(`${where}: “${line}” needs a kind and a name, like “reveal: person/fennick”.`);
      else if (!["rumored", "found", "known"].includes(stage)) warnings.push(`${where}: “${line}”: the stage can be rumored, found or known.`);
      else cur.actions.push({ type: "reveal", ref, stage: stage as Stage });
    } else if ((v = prefixed(line, "fact")) !== null) {
      const ref = v.trim().toLowerCase();
      if (FACT_REF_RE.test(ref)) cur.actions.push({ type: "fact", ref });
      else warnings.push(`${where}: “${line}” needs a kind, a name and a fact, like “fact: person/mags/owes-the-baker”.`);
    } else if ((v = prefixed(line, "sound")) !== null) {
      const t = tapped(v);
      const mix = findMix(t.name);
      if (mix) cur.actions.push({ type: "sound", mix, ...(t.tap ? { tap: true } : {}) });
      else {
        warnings.push(`${where}: no sound called “${v.trim()}”, so “${line}” is kept as a note. Try a mix like “sound: busy tavern”, a layer like “sound: night crickets”, or “sound: off”.`);
        cur.notes.push(line);
      }
    } else if ((v = prefixed(line, "sfx")) !== null) {
      const t = tapped(v);
      const id = findSfx(t.name);
      if (id) cur.actions.push({ type: "sfx", id, ...(t.tap ? { tap: true } : {}) });
      else {
        warnings.push(`${where}: no sound effect called “${v.trim()}”, so “${line}” is kept as a note.`);
        cur.notes.push(line);
      }
    } else if ((v = prefixed(line, "show")) !== null) {
      const a = v.trim() ? resolve(v) : null;
      if (a) cur.actions.push(a);
      else warnings.push(`${where}: nothing called “${v.trim()}” to show, so “show: ${v.trim()}” was left off.`);
    } else if ((v = prefixed(line, "action")) !== null) {
      const a = parseAction(v, resolve);
      if ("action" in a) cur.actions.push(a.action);
      else warnings.push(`${where}: ${a.warning}`);
    } else if (BULLET.test(line)) {
      cur.notes.push(line.replace(BULLET, "").trim());
    } else {
      cur.notes.push(line);
    }
  }
  if (inRead) flushPara();
  if (preamble) warnings.push(`Skipped ${preamble} line${preamble === 1 ? "" : "s"} before the first “##” beat.`);
  if (!beats.length) warnings.push("No beats found. Start each beat with a line like “## Artum bursts in”.");
  return { title: title || fallbackTitle, beats, warnings };
}

function parseAction(v: string, resolve: SceneResolver): { action: BeatAction } | { warning: string } {
  const [verb, ...rest] = v.trim().split(/\s+/);
  const arg = rest.join(" ");
  switch ((verb ?? "").toLowerCase()) {
    case "scene": {
      const a = resolve(arg);
      if (!a) return { warning: `no scene called “${arg}”, so “action: ${v}” was left off.` };
      return { action: a };
    }
    case "black":
      return { action: { type: "black" } };
    case "bank":
      return { action: { type: "bank" } };
    case "stinger":
      return { action: { type: "stinger" } };
    case "initiative":
    case "fight":
      return { warning: `“action: ${v}” was left off: set up a fight with a line like “fight: Goblin x2”.` };
    default:
      return { warning: `didn't recognise “action: ${v}”, so it was left off.` };
  }
}

// ---------------------------------------------------------------------------
// Export

export function actionMarkdown(a: BeatAction, g: AssetGame): string | null {
  if (a.type === "black") return "action: black";
  if (a.type === "bank") return "action: bank";
  if (a.type === "stinger") return "action: stinger";
  if (a.type === "sound") return `sound: ${a.mix}${a.tap ? " (tap)" : ""}`;
  if (a.type === "sfx") return `sfx: ${a.id}${a.tap ? " (tap)" : ""}`;
  if (a.type === "fight") return fightLineMarkdown(a.monsters);
  if (a.type === "reveal") return a.stage === "rumored" ? `rumor: ${a.ref}` : a.stage === "found" ? `reveal: ${a.ref}` : `reveal: ${a.ref} ${a.stage}`;
  if (a.type === "fact") return `fact: ${a.ref}`;
  const ref = actionRef(g, a);
  return ref ? `show: ${ref}` : null;
}

export function checkMarkdown(c: BeatCheck): string {
  const parts = [`${c.skill} DC ${c.dc}`];
  if (c.what) parts.push(c.what);
  if (c.fail) parts.push(`fail: ${c.fail}`);
  if (c.success) parts.push(`success: ${c.success}`);
  return `check: ${parts.join(" | ")}`;
}

/** "story: sb-lucky — Someone suddenly lucky", then the facts it reveals (indented: they reveal when you tick it). */
export function storyMarkdown(block: StoryBlock, g: AssetGame & Partial<Pick<GameState, "story">>): string[] {
  const sb = g.story?.beats.find((b) => b.id === block.storyBeatId);
  if (!sb) return [`story: ${block.storyBeatId}`];
  const out = [`story: ${sb.id} — ${sb.title}`];
  for (const l of sb.links) {
    if (l.kind !== "fact") continue;
    const e = (g.entries ?? []).find((x) => x.id === l.entryId);
    const f = e?.facts.find((x) => x.id === l.factId);
    if (e && f) out.push(`  fact: ${e.kind}/${e.slug}/${f.slug}`);
  }
  return out;
}

export function beatMarkdown(b: Omit<Beat, "id">, g: AssetGame & Partial<Pick<GameState, "story">>): string {
  const out = [`## ${b.title}`];
  const read = () => (b.readAloud ?? []).map((p) => `> ${p}`).join("\n>\n");
  const at = Math.min(b.readAloudAt ?? 0, b.notes.length);
  b.notes.forEach((n, i) => {
    if (i === at && b.readAloud?.length) out.push(read());
    out.push(`- ${n}`);
  });
  if (b.readAloud?.length && at >= b.notes.length) out.push(read());
  for (const c of b.checks) out.push(checkMarkdown(c));
  for (const br of b.branches) out.push(br.then ? `if: ${br.when} → ${br.then}` : `if: ${br.when}`);
  for (const a of b.actions) {
    const m = actionMarkdown(a, g);
    if (m) out.push(m);
  }
  for (const st of b.stories ?? []) out.push(...storyMarkdown(st, g));
  return out.join("\n");
}

export function episodeMarkdown(ep: Pick<Episode, "title" | "beats">, g: AssetGame & Partial<Pick<GameState, "story">>): string {
  return [`# ${ep.title}`, ...ep.beats.map((b) => beatMarkdown(b, g))].join("\n\n") + "\n";
}

/** First line for the "next beat" preview. */
export function beatFirstLine(b: Pick<Beat, "readAloud" | "readAloudAt" | "notes" | "checks">): string {
  if (b.readAloud?.length && (b.readAloudAt ?? 0) === 0) return b.readAloud[0];
  return b.notes[0] ?? b.readAloud?.[0] ?? (b.checks[0] ? `${b.checks[0].skill} DC ${b.checks[0].dc}` : "");
}
