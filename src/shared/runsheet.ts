// Run sheets: episodes as Markdown, in and out. DM-only data (see types.ts).
//
// One beat per "##". Recognised line prefixes:
//   >        read-aloud (a bare ">" is a paragraph break)
//   -        DM note (also *, •, – bullets from pasted docs)
//   check:   <skill> DC <n> | <what> | fail: ... | success: ...
//   if:      <when> → <then>   (-> and => work too)
//   action:  scene <name> | black | bank | initiative
// Anything else becomes a note, so nothing pasted is silently lost.

import type { Beat, BeatAction, BeatCheck, Episode, Scene } from "./types";

export interface ParsedEpisode {
  title: string;
  beats: Omit<Beat, "id">[];
  warnings: string[];
}

export type SceneResolver = (name: string) => string | null;

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
    return hit?.id ?? null;
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

export function parseEpisode(markdown: string, resolve: SceneResolver, fallbackTitle = "New episode"): ParsedEpisode {
  const warnings: string[] = [];
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
    if ((v = prefixed(line, "check")) !== null) {
      const c = parseCheck(v);
      if (c) cur.checks.push(c);
      else {
        warnings.push(`${where}: couldn't find a DC in “check: ${v}”, so it's kept as a note.`);
        cur.notes.push(`Check: ${v}`);
      }
    } else if ((v = prefixed(line, "if")) !== null) {
      const [when, ...rest] = v.split(ARROW);
      cur.branches.push({ when: when.trim(), then: rest.join(" → ").trim() });
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
      const id = resolve(arg);
      if (!id) return { warning: `no scene called “${arg}”, so “action: ${v}” was left off.` };
      return { action: { type: "scene", sceneId: id } };
    }
    case "black":
      return { action: { type: "black" } };
    case "bank":
      return { action: { type: "bank" } };
    case "stinger":
      return { action: { type: "stinger" } };
    case "initiative":
      return { warning: "there's no initiative tracker yet, so “action: initiative” was left off." };
    default:
      return { warning: `didn't recognise “action: ${v}”, so it was left off.` };
  }
}

// ---------------------------------------------------------------------------
// Export

export function actionMarkdown(a: BeatAction, scenes: Pick<Scene, "id" | "label">[]): string | null {
  if (a.type === "black") return "action: black";
  if (a.type === "bank") return "action: bank";
  if (a.type === "stinger") return "action: stinger";
  const sc = scenes.find((s) => s.id === a.sceneId);
  return sc ? `action: scene ${sc.label}` : null;
}

export function checkMarkdown(c: BeatCheck): string {
  const parts = [`${c.skill} DC ${c.dc}`];
  if (c.what) parts.push(c.what);
  if (c.fail) parts.push(`fail: ${c.fail}`);
  if (c.success) parts.push(`success: ${c.success}`);
  return `check: ${parts.join(" | ")}`;
}

export function beatMarkdown(b: Omit<Beat, "id">, scenes: Pick<Scene, "id" | "label">[]): string {
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
    const m = actionMarkdown(a, scenes);
    if (m) out.push(m);
  }
  return out.join("\n");
}

export function episodeMarkdown(ep: Pick<Episode, "title" | "beats">, scenes: Pick<Scene, "id" | "label">[]): string {
  return [`# ${ep.title}`, ...ep.beats.map((b) => beatMarkdown(b, scenes))].join("\n\n") + "\n";
}

/** First line for the "next beat" preview. */
export function beatFirstLine(b: Pick<Beat, "readAloud" | "readAloudAt" | "notes" | "checks">): string {
  if (b.readAloud?.length && (b.readAloudAt ?? 0) === 0) return b.readAloud[0];
  return b.notes[0] ?? b.readAloud?.[0] ?? (b.checks[0] ? `${b.checks[0].skill} DC ${b.checks[0].dc}` : "");
}
