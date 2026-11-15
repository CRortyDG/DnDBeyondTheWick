// Handouts on paper: a title, some words and a signature, drawn on the TV like
// a note from the notice board. Formatting is kept tiny on purpose:
//   a blank line          new paragraph
//   **bold**  *italic*    (also __bold__ and _italic_)
//   -- Lady Vess          a signature line (right-aligned, in the paper's hand)
// It is turned into plain pieces here and into React elements on the TV, never HTML.
import type { NoteFont, Paper, Scene } from "./types";

export const HANDOUT_TITLE_MAX = 120;
export const HANDOUT_BODY_MAX = 4000;
export const HANDOUT_SIGN_MAX = 120;
/** Past this the words come out small on the TV. */
export const HANDOUT_LONG = 1400;

export interface HandoutSheet {
  title: string;
  body: string;
  sign: string;
  paper: Paper;
  font: NoteFont;
  ink?: "red" | "blue" | "gold";
}

export const DEFAULT_SHEET: HandoutSheet = { title: "", body: "", sign: "", paper: "parchment", font: "plain" };

/** A run of text, maybe bold or italic. */
export interface Span {
  text: string;
  b?: boolean;
  i?: boolean;
}
export type Block = { kind: "p"; lines: Span[][] } | { kind: "sign"; spans: Span[] };

/** "**Come** at *once*" -> spans. Unclosed markers stay as typed. */
export function spans(line: string): Span[] {
  const out: Span[] = [];
  const re = /(\*\*|__)(.+?)\1|(\*|_)(?!\s)(.+?)(?<!\s)\3/g;
  let at = 0;
  for (const m of line.matchAll(re)) {
    if (m.index! > at) out.push({ text: line.slice(at, m.index) });
    if (m[1]) out.push(...spans(m[2]).map((s) => ({ ...s, b: true })));
    else out.push(...spans(m[4]).map((s) => ({ ...s, i: true })));
    at = m.index! + m[0].length;
  }
  if (at < line.length) out.push({ text: line.slice(at) });
  return out.filter((s) => s.text);
}

/** The body as paragraphs (lines kept as line breaks) and signature lines. */
export function blocks(body: string): Block[] {
  const out: Block[] = [];
  let para: Span[][] = [];
  const flush = () => {
    if (para.length) out.push({ kind: "p", lines: para });
    para = [];
  };
  for (const raw of body.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const sign = /^\s*(?:--|—|–)\s*(.+)$/.exec(line);
    if (sign) {
      flush();
      out.push({ kind: "sign", spans: spans(sign[1]) });
      continue;
    }
    para.push(spans(line.trim()));
  }
  flush();
  return out;
}

export function sheetOf(sc: Pick<Scene, "sheet">): HandoutSheet | undefined {
  return sc.sheet;
}

/** The handout has words to show. */
export function hasWords(sc: Pick<Scene, "sheet">): boolean {
  const w = sc.sheet;
  return !!w && !!(w.title.trim() || w.body.trim() || w.sign.trim());
}

/** A handout with neither words nor a picture: the TV would show a blank sheet. */
export function emptyHandout(sc: Pick<Scene, "kind" | "art" | "sheet">): boolean {
  return sc.kind === "handout" && !sc.art?.url && !sc.art?.builtin && !hasWords(sc);
}
