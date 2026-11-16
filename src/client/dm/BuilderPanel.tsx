"use client";

// The DM's Worldbuilder page. Review: drafts and suggested changes a builder
// key (Claude Desktop or Claude Code) wrote, as compact rows grouped by kind
// (People, Places, Tables...). Links and facts sit on the row they belong to.
// A row opens a drawer with everything, split into what players can learn and
// what only the DM sees, with Approve, Edit then approve and Reject. Builder notes: the style guide every builder
// session starts from. Keys, the on/off switch and Activity are in Settings.
//
// Everything here is plain text: React escapes it, nothing is read as HTML or
// Markdown, and no link or image from a draft is ever followed.

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Ident } from "../api";
import { useDm } from "./context";
import { Drawer } from "./Drawer";
import { Field } from "./Field";
import { MenuItem, RowMenu } from "./RowMenu";
import { PageHead } from "./PageHead";
import { ReviewMadeUp, reviewCount } from "./ReviewMadeUp";
import { STAGES } from "@/shared/discovery";
import type { GameState, Stage } from "@/shared/types";
import { BUILDER_NOTES_MAX } from "@/shared/commands";

/** A draft as /api/builder-admin/review sends it. */
export interface ReviewDraft {
  id: string;
  kind: string;
  label: string;
  batch: string;
  title: string;
  createdAt: number;
  body: Record<string, unknown>;
  refs: { id: string; name: string; draft: boolean }[];
  diff?: { field: string; before: unknown; now: unknown; after: unknown; gone: boolean; stale: boolean };
}
interface Reviewed {
  id: string;
  kind: string;
  title: string;
  label: string;
  status: string;
  reviewedAt?: number;
}

const KIND_LABEL: Record<string, string> = {
  entry: "Discovery entry",
  fact: "Fact",
  link: "Link",
  thread: "Story thread",
  beat: "Story beat",
  flyer: "Flyer",
  monster: "Monster template",
  table: "Random table",
  suggestion: "Suggested change",
};

/** Field names as the DM reads them. */
const FIELD_LABEL: Record<string, string> = {
  dm_note: "DM note",
  dm_notes: "DM notes",
  secret: "Secret",
  posted_by: "Posted by",
  reward_gp: "Reward (gp)",
  reward_kind: "Reward",
  renown_points: "Renown points",
  dm_adventure: "Adventure",
  dm_loot: "Loot",
  dm_twists: "Twists",
  display_name: "Shown on the TV as",
  init_bonus: "Initiative",
  dmNote: "DM note",
  dmNotes: "DM notes",
  secrets: "Secrets",
  postedBy: "Posted by",
};
const label = (k: string) => FIELD_LABEL[k] ?? k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " ");
/** Fields the card doesn't list (shown another way, or ids). */
const HIDDEN_FIELDS = new Set(["entry", "a", "b", "thread", "target", "target_name", "field", "before", "value"]);

/** Any value as plain text for the card. */
function asText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (x && typeof x === "object" && "text" in x) {
          const r = x as { from?: number; to?: number; text: string; name?: string };
          return r.from !== undefined ? `${r.from}${r.to !== undefined && r.to !== r.from ? `–${r.to}` : ""}: ${r.text}` : r.text;
        }
        if (x && typeof x === "object" && "name" in x) return Object.values(x as object).map(asText).filter(Boolean).join(", ");
        return asText(x);
      })
      .join("\n");
  }
  if (typeof v === "object") return Object.entries(v as object).map(([k, x]) => `${label(k)}: ${asText(x)}`).join("\n");
  return "";
}

function when(at: number): string {
  return new Date(at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

// ---------------------------------------------------------------- grouping

/** The review list's sections, in the order they're shown. */
const SECTIONS: { key: string; label: string; one: string; test: (d: ReviewDraft) => boolean }[] = [
  { key: "person", label: "People", one: "Person", test: (d) => d.kind === "entry" && d.body.kind === "person" },
  { key: "place", label: "Places", one: "Place", test: (d) => d.kind === "entry" && d.body.kind === "place" },
  { key: "shop", label: "Shops", one: "Shop", test: (d) => d.kind === "entry" && d.body.kind === "shop" },
  { key: "entry", label: "Other entries", one: "Entry", test: (d) => d.kind === "entry" },
  { key: "thread", label: "Story threads", one: "Story thread", test: (d) => d.kind === "thread" },
  { key: "beat", label: "Story beats", one: "Story beat", test: (d) => d.kind === "beat" },
  { key: "flyer", label: "Flyers", one: "Flyer", test: (d) => d.kind === "flyer" },
  { key: "monster", label: "Monster templates", one: "Monster template", test: (d) => d.kind === "monster" },
  { key: "table", label: "Random tables", one: "Random table", test: (d) => d.kind === "table" },
  { key: "fact", label: "Facts", one: "Fact", test: (d) => d.kind === "fact" },
  { key: "link", label: "Links", one: "Link", test: (d) => d.kind === "link" },
  { key: "suggestion", label: "Suggested changes", one: "Suggested change", test: (d) => d.kind === "suggestion" },
];
const sectionOf = (d: ReviewDraft) => SECTIONS.find((s) => s.test(d)) ?? SECTIONS[3];

/** A ref's name without the server's "(draft)" suffix. */
const refName = (r: { name: string }) => r.name.replace(/ \(draft\)$/, "");

/**
 * Links and facts that hang off a pending draft are shown on that draft's row
 * (and approved or rejected with it), so the list has one row per thing.
 * Ones that only touch what's already in the game keep their own row.
 */
export function foldDrafts(pending: ReviewDraft[]): { top: ReviewDraft[]; hangers: Map<string, ReviewDraft[]> } {
  const ids = new Set(pending.map((d) => d.id));
  const hangers = new Map<string, ReviewDraft[]>();
  const top: ReviewDraft[] = [];
  for (const d of pending) {
    if (d.kind === "link" || d.kind === "fact") {
      const parents = d.refs.filter((r) => r.draft && ids.has(r.id));
      if (parents.length) {
        for (const p of parents) hangers.set(p.id, [...(hangers.get(p.id) ?? []), d]);
        continue;
      }
    }
    top.push(d);
  }
  return { top, hangers };
}

/** What approving these also takes along: links and facts whose every pending end is being approved. */
export function approveSet(pending: ReviewDraft[], ids: string[]): string[] {
  const ok = (d: ReviewDraft) => !d.diff?.stale && !d.diff?.gone;
  const chosen = new Set(ids.filter((id) => pending.some((d) => d.id === id && ok(d))));
  const waiting = new Set(pending.map((d) => d.id));
  for (let grew = true; grew; ) {
    grew = false;
    for (const d of pending) {
      if (chosen.has(d.id) || (d.kind !== "link" && d.kind !== "fact")) continue;
      const ends = d.refs.filter((r) => r.draft && waiting.has(r.id));
      if (ends.length && ends.every((r) => chosen.has(r.id))) chosen.add(d.id), (grew = true);
    }
  }
  return [...chosen];
}

/** What rejecting these also takes along: anything that hangs off them (the server does the same). */
export function rejectSet(pending: ReviewDraft[], ids: string[]): string[] {
  const chosen = new Set(ids);
  for (let grew = true; grew; ) {
    grew = false;
    for (const d of pending) if (!chosen.has(d.id) && d.refs.some((r) => r.draft && chosen.has(r.id))) chosen.add(d.id), (grew = true);
  }
  return [...chosen];
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const firstLine = (s: string) => s.split("\n")[0];

/** The row's title, the bit after it, and the one-line summary under it. */
export function rowText(d: ReviewDraft): { title: string; aside: string; sub: string } {
  const b = d.body;
  switch (d.kind) {
    case "entry":
      return { title: d.title, aside: str(b.title), sub: firstLine(str(b.hint) || str(b.summary)) };
    case "link":
      return { title: d.refs.map(refName).join(" ↔ "), aside: "", sub: "Lets players follow one to the other once both are revealed" };
    case "fact":
      return { title: d.title, aside: "", sub: d.refs[0] ? `About ${refName(d.refs[0])}` : "" };
    case "beat":
      return { title: d.title, aside: d.refs[0] ? `on ${refName(d.refs[0])}` : "", sub: firstLine(str(b.summary)) };
    case "thread":
      return { title: d.title, aside: str(b.kind) ? `${str(b.kind)} thread` : "", sub: firstLine(str(b.description) || str(b.goal)) };
    case "flyer": {
      const bits = [b.board === "job" ? "Job" : "Notice", typeof b.reward_gp === "number" ? `${b.reward_gp} gp` : "", str(b.posted_by) ? `from ${str(b.posted_by)}` : ""].filter(Boolean);
      return { title: d.title, aside: bits.join(" · "), sub: firstLine(str(b.body)) };
    }
    case "monster":
      return { title: d.title, aside: `AC ${asText(b.ac)} · HP ${asText(b.hp)}`, sub: firstLine(str(b.notes)) };
    case "table": {
      const rows = Array.isArray(b.rows) ? b.rows.length : 0;
      return { title: d.title, aside: `d${asText(b.die)} ${str(b.kind)}`, sub: `${plural(rows, "row")}${str(b.dm_note) ? ` · ${str(b.dm_note)}` : ""}` };
    }
    case "suggestion":
      return { title: str(b.target_name) || d.title, aside: `change ${label(str(b.field)).toLowerCase()}`, sub: str(b.reason) };
    default:
      return { title: d.title, aside: "", sub: "" };
  }
}

// ---------------------------------------------------------------- the row

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/** One line in the review list. Pure, so it can be rendered in tests. */
export function DraftRow({
  draft,
  hangers = [],
  busy,
  picked,
  selected,
  onPick,
  onOpen,
  onApprove,
  onReject,
  onEdit,
}: {
  draft: ReviewDraft;
  hangers?: ReviewDraft[];
  busy: boolean;
  picked?: boolean;
  selected?: boolean;
  onPick?: (on: boolean) => void;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit?: () => void;
}) {
  const t = rowText(draft);
  const b = draft.body;
  const links = hangers.filter((h) => h.kind === "link").length;
  const facts = hangers.filter((h) => h.kind === "fact").length + (Array.isArray(b.facts) ? b.facts.length : 0);
  const bad = draft.diff?.stale || draft.diff?.gone;
  return (
    <li className={`list-row draft-row${selected ? " selected" : ""}${bad ? " draft-stale" : ""}`}>
      <div className="scene-row">
        {onPick ? <input type="checkbox" className="draft-pick" checked={!!picked} onChange={(e) => onPick(e.target.checked)} aria-label={`Pick ${t.title}`} /> : null}
        <button type="button" className="row-main" onClick={onOpen} title="Read it all">
          <span className="row-title">
            {t.title}
            {t.aside ? <span className="row-aside"> · {t.aside}</span> : null}
          </span>
          {t.sub ? <span className="row-sub">{t.sub}</span> : null}
        </button>
        <span className="row-meta">
          {bad ? <span className="tag warn">{draft.diff?.gone ? "Gone" : "Out of date"}</span> : null}
          {str(b.secret) ? <span className="tag" title="Has a secret (only you see it)">Secret</span> : null}
          {facts ? <span className="tag">{plural(facts, "fact")}</span> : null}
          {links ? (
            <span className="tag" title={hangers.filter((h) => h.kind === "link").map((h) => h.refs.map(refName).join(" ↔ ")).join("\n")}>
              {plural(links, "link")}
            </span>
          ) : null}
        </span>
        <button className="btn small draft-yes" type="button" disabled={busy || bad} onClick={onApprove} title={hangers.length ? "Approve, with the links and facts on it" : "Approve"}>
          <IconCheck />
          <span className="draft-btn-text">Approve</span>
        </button>
        <button className="btn small icon-only draft-no" type="button" disabled={busy} onClick={onReject} aria-label={`Reject ${t.title}`} title="Reject">
          <IconX />
        </button>
        <RowMenu label={t.title}>
          <MenuItem onClick={onOpen}>Read it all</MenuItem>
          {onEdit && !draft.diff ? <MenuItem onClick={onEdit}>Edit then approve</MenuItem> : null}
          <MenuItem danger onClick={onReject}>
            Reject
          </MenuItem>
        </RowMenu>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- the drawer

/** Fields players can come to see (once you reveal them), and ones only the DM sees. */
const PLAYER_FIELDS = ["nickname", "summary", "hint", "areas", "display_name", "body", "posted_by", "reward_gp", "reward_kind", "renown", "renown_points", "description", "goal"];
const DM_FIELDS = ["secret", "wants", "knows", "voice", "dm_note", "dm_notes", "dm_adventure", "dm_loot", "dm_twists", "notes", "reason"];
const SHOWN_ELSEWHERE = new Set([...HIDDEN_FIELDS, "kind", "name", "title", "facts", "rows", "die", "board", "type", "window", "reason"]);

function Fields({ body, keys }: { body: Record<string, unknown>; keys: string[] }) {
  const has = (v: unknown) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length);
  const list = keys.filter((k) => has(body[k]));
  if (!list.length) return null;
  return (
    <dl className="draft-fields">
      {list.map((k) => (
        <div key={k}>
          <dt>{label(k)}</dt>
          <dd className={k === "secret" ? "draft-secret" : undefined}>{k === "areas" && Array.isArray(body[k]) ? (body[k] as string[]).join(", ") : asText(body[k])}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Everything about one draft, for the drawer. Pure, so it can be rendered in tests. */
export function DraftDetail({
  draft,
  hangers = [],
  busy,
  onOpenRef,
  onApprove,
  onReject,
  onRejectOne,
  onEdit,
  startEditing = false,
}: {
  draft: ReviewDraft;
  hangers?: ReviewDraft[];
  busy: boolean;
  startEditing?: boolean;
  onOpenRef?: (id: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onRejectOne?: (id: string) => void;
  onEdit: (body: Record<string, unknown>) => Promise<boolean> | void;
}) {
  const [editing, setEditing] = useState(startEditing);
  const b = draft.body;
  const d = draft.diff;
  const rest = Object.keys(b).filter((k) => !SHOWN_ELSEWHERE.has(k) && !PLAYER_FIELDS.includes(k) && !DM_FIELDS.includes(k));
  const facts = [...(Array.isArray(b.facts) ? (b.facts as unknown[]).map((f) => ({ id: "", text: asText(f) })) : []), ...hangers.filter((h) => h.kind === "fact").map((h) => ({ id: h.id, text: str(h.body.text) }))];
  const links = hangers.filter((h) => h.kind === "link");
  const RefName = ({ r }: { r: { id: string; name: string; draft: boolean } }) =>
    r.draft && r.id !== draft.id && onOpenRef ? (
      <button type="button" className="draft-ref" onClick={() => onOpenRef(r.id)} title="Open that draft">
        {refName(r)}
      </button>
    ) : (
      <b>{refName(r)}</b>
    );
  if (editing) {
    return (
      <DraftEditor
        body={draft.body}
        onCancel={() => setEditing(false)}
        onSave={async (nb) => {
          if ((await onEdit(nb)) !== false) setEditing(false);
        }}
      />
    );
  }
  return (
    <div className="draft-detail">
      {draft.refs.length && draft.kind !== "suggestion" ? (
        <p className="note">
          {draft.kind === "link" ? "Links " : draft.kind === "beat" ? "On " : "About "}
          {draft.refs.map((r, i) => (
            <span key={r.id}>
              {i ? " and " : ""}
              <RefName r={r} />
            </span>
          ))}
          {draft.refs.some((r) => r.draft) ? ". Approving this approves that draft too." : ""}
        </p>
      ) : null}
      {d ? (
        <div className="draft-diff">
          <p className="note">
            Change <b>{label(d.field)}</b>
            {str(b.reason) ? <> because: {str(b.reason)}</> : null}
          </p>
          {d.gone ? <p className="warn">What this changes has been deleted. Reject it.</p> : null}
          {d.stale ? <p className="warn">This was changed after the suggestion was made, so approving it is refused. Here is what it says now:</p> : null}
          <div className="diff-cols">
            <div>
              <div className="diff-h">{d.stale ? "Now" : "Before"}</div>
              <pre className="diff-before">{asText(d.stale ? d.now : d.before)}</pre>
            </div>
            <div>
              <div className="diff-h">After</div>
              <pre className="diff-after">{asText(d.after)}</pre>
            </div>
          </div>
        </div>
      ) : (
        <>
          {draft.kind === "fact" ? <p className="draft-lead">{str(b.text)}</p> : null}
          {PLAYER_FIELDS.some((k) => b[k] !== undefined && b[k] !== "") || facts.length ? (
            <section className="draft-group">
              <h4>{draft.kind === "entry" ? "What players can learn" : "Shown to players"}</h4>
              {draft.kind === "entry" ? <p className="note">Only once you reveal it. Approving keeps it hidden.</p> : null}
              <Fields body={b} keys={PLAYER_FIELDS} />
              {facts.length ? (
                <div className="draft-facts">
                  <div className="draft-sub-h">Facts to reveal</div>
                  <ul>
                    {facts.map((f, i) => (
                      <li key={f.id || i}>
                        <span>{f.text}</span>
                        {f.id && onRejectOne ? (
                          <button type="button" className="btn small icon-only" disabled={busy} onClick={() => onRejectOne(f.id)} aria-label="Reject this fact" title="Reject this fact">
                            <IconX />
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}
          {draft.kind === "table" && Array.isArray(b.rows) ? (
            <section className="draft-group">
              <h4>Rows</h4>
              <ol className="rtable-rows">
                {(b.rows as { from?: number; to?: number; text: string }[]).map((r, i) => (
                  <li key={i}>
                    <span className="rtable-range">{r.from !== undefined ? `${r.from}${r.to !== undefined && r.to !== r.from ? `–${r.to}` : ""}` : i + 1}</span>
                    <span>{r.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {DM_FIELDS.some((k) => k !== "reason" && b[k] !== undefined && b[k] !== "") ? (
            <section className="draft-group draft-dm">
              <h4>Only you see</h4>
              <Fields body={b} keys={DM_FIELDS.filter((k) => k !== "reason")} />
            </section>
          ) : null}
          {rest.length ? (
            <section className="draft-group">
              <h4>Details</h4>
              <Fields body={b} keys={rest} />
            </section>
          ) : null}
        </>
      )}
      {links.length ? (
        <section className="draft-group">
          <h4>Linked to</h4>
          <ul className="draft-links">
            {links.map((l) => {
              const other = l.refs.find((r) => r.id !== draft.id) ?? l.refs[0];
              return (
                <li key={l.id}>
                  <RefName r={other} />
                  {other.draft ? <span className="tag">draft</span> : <span className="note">already in the game</span>}
                  <span className="spacer" />
                  {onRejectOne ? (
                    <button type="button" className="btn small icon-only" disabled={busy} onClick={() => onRejectOne(l.id)} aria-label={`Reject the link to ${refName(other)}`} title="Reject this link">
                      <IconX />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {links.some((l) => l.refs.some((r) => r.draft && r.id !== draft.id)) ? <p className="note">A link to another draft is approved once both ends are.</p> : null}
        </section>
      ) : null}
      <div className="draft-actions">
        <button className="btn primary" type="button" disabled={busy || d?.stale || d?.gone} onClick={onApprove}>
          <IconCheck /> Approve
        </button>
        {!d ? (
          <button className="btn" type="button" disabled={busy} onClick={() => setEditing(true)}>
            Edit then approve
          </button>
        ) : null}
        <span className="spacer" />
        <button className="btn" type="button" disabled={busy} onClick={onReject}>
          <IconX /> Reject
        </button>
      </div>
    </div>
  );
}

/** Kept for older callers: the whole draft as one block. */
export const DraftCard = DraftDetail;

/** Text, lists and numbers in a draft, as plain inputs. Anything else (attacks, table rows) is edited after approving. */
function DraftEditor({ body, onSave, onCancel }: { body: Record<string, unknown>; onSave: (b: Record<string, unknown>) => void; onCancel: () => void }) {
  const [b, setB] = useState<Record<string, unknown>>(() => structuredClone(body));
  const set = (k: string, v: unknown) => setB((x) => ({ ...x, [k]: v }));
  return (
    <div className="form draft-edit">
      {Object.entries(b)
        .filter(([k]) => !HIDDEN_FIELDS.has(k) && k !== "kind" && k !== "board" && k !== "die")
        .map(([k, v]) => {
          if (typeof v === "number") {
            return (
              <label key={k} className="fld-row">
                <span>{label(k)}</span>
                <input className="fld" type="number" value={v} onChange={(e) => set(k, Number(e.target.value))} />
              </label>
            );
          }
          if (typeof v === "string") {
            const long = v.length > 80 || /note|summary|body|secret|wants|knows|text/.test(k);
            return (
              <label key={k} className="fld-row">
                <span>{label(k)}</span>
                {long ? <textarea className="fld" rows={3} value={v} onChange={(e) => set(k, e.target.value)} /> : <input className="fld" value={v} onChange={(e) => set(k, e.target.value)} />}
              </label>
            );
          }
          if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
            return (
              <label key={k} className="fld-row">
                <span>{label(k)} (one per line)</span>
                <textarea className="fld" rows={3} value={(v as string[]).join("\n")} onChange={(e) => set(k, e.target.value.split("\n"))} />
              </label>
            );
          }
          return (
            <div key={k} className="fld-row">
              <span>{label(k)}</span>
              <pre className="note">{asText(v)}</pre>
            </div>
          );
        })}
      <div className="inline">
        <button
          className="btn small primary"
          type="button"
          onClick={() => {
            const out = Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]).map((x) => x.trim()).filter(Boolean) : v]));
            onSave(out);
          }}
        >
          Save and approve
        </button>
        <button className="btn small" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** How many drafts wait for review (for the sidebar badge). Checked on load and every few minutes. */
export function usePendingDrafts(ident: Ident): [number, () => void] {
  const [n, setN] = useState(0);
  const load = useCallback(() => {
    api<{ pending: number; rows?: number }>("/api/builder-admin/status", ident)
      .then((r) => setN(r.rows ?? r.pending))
      .catch(() => {});
  }, [ident]);
  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => clearInterval(t);
  }, [load]);
  return [n, load];
}

export function BuilderPanel({ onCount }: { onCount?: () => void }) {
  const { view, run, ident, toast } = useDm();
  const [part, setPart] = useState<"review" | "table" | "notes">("review");
  const flagged = reviewCount(view.state as unknown as GameState);
  const [pending, setPending] = useState<ReviewDraft[] | null>(null);
  const [reviewed, setReviewed] = useState<Reviewed[]>([]);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("hidden");
  const [show, setShow] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ pending: ReviewDraft[]; reviewed: Reviewed[] }>("/api/builder-admin/review", ident);
      setPending(r.pending);
      setReviewed(r.reviewed);
      setPicked((p) => p.filter((id) => r.pending.some((d) => d.id === id)));
      return r.pending;
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [ident, toast]);
  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const all = pending ?? [];
  const { top, hangers } = useMemo(() => foldDrafts(all), [all]);
  const sections = useMemo(
    () =>
      SECTIONS.map((s) => ({ ...s, list: top.filter((d) => sectionOf(d) === s) })).filter((s) => s.list.length),
    [top],
  );
  const order = sections.flatMap((s) => s.list);
  const shown = show === "all" ? sections : sections.filter((s) => s.key === show);
  const openDraft = open ? all.find((d) => d.id === open) : undefined;

  /** Approve or reject, with what hangs off them, then move the drawer on to the next row. */
  const act = async (path: "approve" | "reject", asked: string[], what?: string) => {
    const ids = path === "approve" ? approveSet(all, asked) : rejectSet(all, asked);
    if (!ids.length) return;
    const next = open && ids.includes(open) ? order.slice(order.findIndex((d) => d.id === open) + 1).find((d) => !ids.includes(d.id)) : undefined;
    setBusy(true);
    try {
      await api(`/api/builder-admin/${path}`, ident, { method: "POST", body: JSON.stringify(path === "approve" ? { ids, stage } : { ids }) });
      const head = what ?? plural(asked.length, "draft");
      const more = all.filter((d) => ids.includes(d.id) && !asked.includes(d.id));
      const nLinks = more.filter((d) => d.kind === "link").length;
      const nFacts = more.filter((d) => d.kind === "fact").length;
      const nOther = more.length - nLinks - nFacts;
      const bits = [nLinks ? plural(nLinks, "link") : "", nFacts ? plural(nFacts, "fact") : "", nOther ? plural(nOther, "draft") : ""].filter(Boolean);
      const tail = bits.length ? ` and ${bits.join(" and ")} on it` : "";
      toast(path === "approve" ? `Approved ${head}${tail}.${stage === "hidden" ? " It stays Hidden until you reveal it." : ""}` : `Rejected ${head}${tail}.`);
      if (open && ids.includes(open)) setOpen(next?.id ?? null);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
    await load();
    onCount?.();
  };
  const edit = async (id: string, body: Record<string, unknown>) => {
    try {
      await api("/api/builder-admin/review-edit", ident, { method: "POST", body: JSON.stringify({ id, body }) });
      await load();
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
      return false;
    }
  };
  const nameOf = (d: ReviewDraft) => `"${rowText(d).title}"`;
  const pickAll = (ids: string[], on: boolean) => setPicked((p) => (on ? [...new Set([...p, ...ids])] : p.filter((x) => !ids.includes(x))));
  const openIdx = openDraft ? order.findIndex((d) => d.id === openDraft.id) : -1;
  const linkCount = all.filter((d) => d.kind === "link").length;

  return (
    <div className="pg builder-panel">
      <PageHead
        title="Worldbuilder"
        sub="Drafts Claude wrote with a builder key. Nothing reaches the game until you approve it, and approving never reveals anything."
        help={
          <>
            <p>
              Builder keys are made in Settings. Claude can read your campaign notes and write drafts: people, places, facts, story beats, flyers, monster templates and random tables. It can
              also suggest a change to something that already exists. It can never change game state, reveal, pin, delete or approve.
            </p>
            <p>Links and facts sit on the person or place they belong to and are approved or rejected with it. Open a row to read it all, or to reject one link.</p>
            <p>Approved entries go in Hidden (or the stage you pick above the list). Flyers and notes go in the drawer, not on the board. Players see things only when you reveal or pin them as usual.</p>
          </>
        }
        stats={[
          { label: "Waiting for review", value: pending ? top.length : "…", tone: top.length ? "gold" : "muted" },
          ...(linkCount ? [{ label: "Links between them", value: linkCount, tone: "muted" as const }] : []),
          { label: "Made at the table", value: flagged, tone: flagged ? "gold" : "muted" },
        ]}
      />
      <div className="seg" role="group" aria-label="Worldbuilder">
        <button type="button" className={`btn small${part === "review" ? " on" : ""}`} aria-pressed={part === "review"} onClick={() => setPart("review")}>
          Review{top.length ? ` (${top.length})` : ""}
        </button>
        <button type="button" className={`btn small${part === "table" ? " on" : ""}`} aria-pressed={part === "table"} onClick={() => setPart("table")}>
          Made at the table{flagged ? ` (${flagged})` : ""}
        </button>
        <button type="button" className={`btn small${part === "notes" ? " on" : ""}`} aria-pressed={part === "notes"} onClick={() => setPart("notes")}>
          Builder notes
        </button>
      </div>

      {part === "table" ? (
        <ReviewMadeUp />
      ) : part === "notes" ? (
        <section className="box">
          <h3>Builder notes</h3>
          <p className="note">The style guide. Claude reads this first in every worldbuilding session. Tone, rules and things it must respect.</p>
          <Field
            label="Builder notes"
            multiline
            value={view.state.builderNotes ?? ""}
            placeholder={"Candlefair is cozy; the wild is dangerous.\nNever name the merchant.\nPrices follow the shop catalog."}
            hint={`Up to ${BUILDER_NOTES_MAX.toLocaleString()} characters.`}
            onCommit={(v) => run({ type: "game.builderNotes", text: v.slice(0, BUILDER_NOTES_MAX) }, "Builder notes saved.")}
          />
        </section>
      ) : pending === null ? (
        <p className="note">Loading&hellip;</p>
      ) : (
        <>
          {top.length ? (
            <div className="builder-bar">
              {sections.length > 1 ? (
                <div className="seg builder-filter" role="group" aria-label="Show">
                  <button type="button" className={`btn small${show === "all" ? " on" : ""}`} aria-pressed={show === "all"} onClick={() => setShow("all")}>
                    All {top.length}
                  </button>
                  {sections.map((s) => (
                    <button key={s.key} type="button" className={`btn small${show === s.key ? " on" : ""}`} aria-pressed={show === s.key} onClick={() => setShow(s.key)}>
                      {s.label} {s.list.length}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="builder-bulk">
                <label className="builder-stage">
                  <span className="note">Approve as</span>
                  <select className="fld" value={stage} onChange={(e) => setStage(e.target.value as Stage)} aria-label="Approve entries as">
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        {s === "hidden" ? " (recommended)" : " (players will see it)"}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="spacer" />
                {picked.length ? (
                  <>
                    <span className="note">{picked.length} picked</span>
                    <button className="btn small primary" type="button" disabled={busy} onClick={() => void act("approve", picked)}>
                      <IconCheck /> Approve
                    </button>
                    <button className="btn small" type="button" disabled={busy} onClick={() => void act("reject", picked)}>
                      <IconX /> Reject
                    </button>
                    <button className="btn small" type="button" onClick={() => setPicked([])}>
                      Clear
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn small primary"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const ids = shown.flatMap((s) => s.list.map((d) => d.id));
                        if (window.confirm(`Approve ${plural(ids.length, "draft")}${show === "all" ? "" : ` in ${shown[0]?.label ?? ""}`}, with their links and facts? They go in as ${stage}.`)) void act("approve", ids);
                      }}
                    >
                      <IconCheck /> Approve all{show === "all" ? "" : ` ${shown[0]?.label.toLowerCase() ?? ""}`}
                    </button>
                    <button
                      className="btn small"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const ids = shown.flatMap((s) => s.list.map((d) => d.id));
                        if (window.confirm(`Reject ${plural(ids.length, "draft")}${show === "all" ? "" : ` in ${shown[0]?.label ?? ""}`}? This can't be undone.`)) void act("reject", ids);
                      }}
                    >
                      Reject all
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="pg-empty">
              <p className="note">Nothing waiting. Drafts from a worldbuilding chat show up here.</p>
            </div>
          )}
          {shown.map((s) => {
            const ids = s.list.map((d) => d.id);
            const allPicked = ids.every((id) => picked.includes(id));
            return (
              <section key={s.key} className="builder-section">
                <div className="builder-section-head">
                  <input type="checkbox" className="draft-pick" checked={allPicked} onChange={(e) => pickAll(ids, e.target.checked)} aria-label={`Pick all ${s.label.toLowerCase()}`} />
                  <h3>
                    {s.label} <span className="note">{s.list.length}</span>
                  </h3>
                </div>
                <ul className="row-list builder-list">
                  {s.list.map((d) => (
                    <DraftRow
                      key={d.id}
                      draft={d}
                      hangers={hangers.get(d.id)}
                      busy={busy}
                      selected={open === d.id}
                      picked={picked.includes(d.id)}
                      onPick={(on) => pickAll([d.id], on)}
                      onOpen={() => {
                        setEditId(null);
                        setOpen(d.id);
                      }}
                      onApprove={() => void act("approve", [d.id], nameOf(d))}
                      onReject={() => void act("reject", [d.id], nameOf(d))}
                      onEdit={() => {
                        setEditId(d.id);
                        setOpen(d.id);
                      }}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
          {reviewed.length ? (
            <details className="box builder-reviewed">
              <summary>
                <h3>Recently reviewed</h3>
              </summary>
              <ul className="plain">
                {reviewed.map((r) => (
                  <li key={r.id}>
                    <span className={`tag${r.status === "approved" ? " ok" : ""}`}>{r.status}</span> {KIND_LABEL[r.kind] ?? r.kind}: {r.title} <span className="note">by {r.label}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
      {openDraft && part === "review" ? (
        <Drawer
          title={rowText(openDraft).title}
          subtitle={
            <>
              {sectionOf(openDraft).one}
              {str(openDraft.body.title) && openDraft.kind === "entry" ? ` · ${str(openDraft.body.title)}` : ""} · by {openDraft.label} · {when(openDraft.createdAt)}
            </>
          }
          onClose={() => setOpen(null)}
          closeLabel="Close"
          wide
        >
          {openIdx >= 0 ? (
            <div className="draft-nav">
              <button className="btn small" type="button" disabled={openIdx <= 0} onClick={() => setOpen(order[openIdx - 1].id)}>
                &lsaquo; Previous
              </button>
              <span className="note">
                {openIdx + 1} of {order.length}
              </span>
              <button className="btn small" type="button" disabled={openIdx >= order.length - 1} onClick={() => setOpen(order[openIdx + 1].id)}>
                Next &rsaquo;
              </button>
            </div>
          ) : null}
          <DraftDetail
            key={`${openDraft.id}:${editId === openDraft.id}`}
            draft={openDraft}
            hangers={hangers.get(openDraft.id)}
            busy={busy}
            startEditing={editId === openDraft.id}
            onOpenRef={(id) => setOpen(id)}
            onApprove={() => void act("approve", [openDraft.id], nameOf(openDraft))}
            onReject={() => void act("reject", [openDraft.id], nameOf(openDraft))}
            onRejectOne={(id) => {
              const x = all.find((d) => d.id === id);
              void act("reject", [id], x?.kind === "fact" ? "the fact" : "the link");
            }}
            onEdit={async (b) => (await edit(openDraft.id, b)) && (await act("approve", [openDraft.id], nameOf(openDraft)), true)}
          />
        </Drawer>
      ) : null}
    </div>
  );
}
