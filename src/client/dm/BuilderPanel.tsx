"use client";

// The DM's Worldbuilder page. Review: drafts and suggested changes a builder
// key (Claude Desktop or Claude Code) wrote, grouped by chat, with Approve,
// Edit then approve and Reject. Builder notes: the style guide every builder
// session starts from. Keys, the on/off switch and Activity are in Settings.
//
// Everything here is plain text: React escapes it, nothing is read as HTML or
// Markdown, and no link or image from a draft is ever followed.

import { useCallback, useEffect, useState } from "react";
import { api, type Ident } from "../api";
import { useDm } from "./context";
import { Field } from "./Field";
import { PageHead } from "./PageHead";
import { STAGES } from "@/shared/discovery";
import type { Stage } from "@/shared/types";
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

/** One draft or suggestion. Pure, so it can be rendered in tests. */
export function DraftCard({
  draft,
  busy,
  picked,
  onPick,
  onApprove,
  onReject,
  onEdit,
}: {
  draft: ReviewDraft;
  busy: boolean;
  picked?: boolean;
  onPick?: (on: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: (body: Record<string, unknown>) => Promise<boolean> | void;
}) {
  const [editing, setEditing] = useState(false);
  const fields = Object.entries(draft.body).filter(([k, v]) => !HIDDEN_FIELDS.has(k) && v !== undefined && v !== "" && !(Array.isArray(v) && !v.length));
  const d = draft.diff;
  return (
    <article className={`box draft-card${d?.stale || d?.gone ? " draft-stale" : ""}`}>
      <header className="draft-head">
        {onPick ? <input type="checkbox" checked={!!picked} onChange={(e) => onPick(e.target.checked)} aria-label={`Pick ${draft.title}`} /> : null}
        <span className="tag">{KIND_LABEL[draft.kind] ?? draft.kind}</span>
        <b className="draft-title">{draft.title}</b>
        <span className="spacer" />
        <span className="note">
          by {draft.label} &middot; {when(draft.createdAt)}
        </span>
      </header>
      {draft.refs.length ? (
        <p className="note">
          {draft.kind === "link" ? "Links " : draft.kind === "beat" ? "On " : "About "}
          {draft.refs.map((r, i) => (
            <span key={r.id}>
              {i ? " and " : ""}
              <b>{r.name}</b>
            </span>
          ))}
          {draft.refs.some((r) => r.draft) ? " (approving this approves that draft too)" : ""}
        </p>
      ) : null}
      {d ? (
        <div className="draft-diff">
          <p className="note">
            Change <b>{label(d.field)}</b>
            {typeof draft.body.reason === "string" && draft.body.reason ? <> because: {draft.body.reason}</> : null}
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
      ) : editing ? (
        <DraftEditor
          body={draft.body}
          onCancel={() => setEditing(false)}
          onSave={async (b) => {
            if ((await onEdit(b)) !== false) setEditing(false);
          }}
        />
      ) : (
        <dl className="draft-fields">
          {fields.map(([k, v]) => (
            <div key={k}>
              <dt>{label(k)}</dt>
              <dd>{asText(v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {!editing ? (
        <div className="inline">
          <button className="btn small primary" type="button" disabled={busy || d?.stale || d?.gone} onClick={onApprove}>
            Approve
          </button>
          {!d ? (
            <button className="btn small" type="button" disabled={busy} onClick={() => setEditing(true)}>
              Edit then approve
            </button>
          ) : null}
          <button className="btn small" type="button" disabled={busy} onClick={onReject}>
            Reject
          </button>
        </div>
      ) : null}
    </article>
  );
}

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
          Save
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
    api<{ pending: number }>("/api/builder-admin/status", ident)
      .then((r) => setN(r.pending))
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
  const [part, setPart] = useState<"review" | "notes">("review");
  const [pending, setPending] = useState<ReviewDraft[] | null>(null);
  const [reviewed, setReviewed] = useState<Reviewed[]>([]);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("hidden");

  const load = useCallback(async () => {
    try {
      const r = await api<{ pending: ReviewDraft[]; reviewed: Reviewed[] }>("/api/builder-admin/review", ident);
      setPending(r.pending);
      setReviewed(r.reviewed);
      setPicked((p) => p.filter((id) => r.pending.some((d) => d.id === id)));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  }, [ident, toast]);
  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (path: "approve" | "reject", ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    try {
      const r = await api<{ approved?: number; rejected?: number }>(`/api/builder-admin/${path}`, ident, { method: "POST", body: JSON.stringify(path === "approve" ? { ids, stage } : { ids }) });
      const n = r.approved ?? r.rejected ?? 0;
      toast(path === "approve" ? `Approved ${n}. ${stage === "hidden" ? "Everything stays Hidden until you reveal it." : ""}` : `Rejected ${n}.`);
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

  // Grouped by chat (batch), oldest chat first.
  const groups = new Map<string, ReviewDraft[]>();
  for (const d of pending ?? []) {
    const k = `${d.label}\u0000${d.batch}`;
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }

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
            <p>Approved entries go in Hidden (or the stage you pick above the list). Flyers and notes go in the drawer, not on the board. Players see things only when you reveal or pin them as usual.</p>
          </>
        }
        stats={[{ label: "Waiting for review", value: pending?.length ?? "…", tone: pending?.length ? "gold" : "muted" }]}
      />
      <div className="seg" role="group" aria-label="Worldbuilder">
        <button type="button" className={`btn small${part === "review" ? " on" : ""}`} aria-pressed={part === "review"} onClick={() => setPart("review")}>
          Review
        </button>
        <button type="button" className={`btn small${part === "notes" ? " on" : ""}`} aria-pressed={part === "notes"} onClick={() => setPart("notes")}>
          Builder notes
        </button>
      </div>

      {part === "notes" ? (
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
          {pending.length ? (
            <div className="inline builder-bulk">
              <label className="fld-row">
                <span>Approve entries as</span>
                <select className="fld" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {s === "hidden" ? " (recommended)" : " (players will see it)"}
                    </option>
                  ))}
                </select>
              </label>
              <span className="spacer" />
              <button className="btn small primary" type="button" disabled={busy || !picked.length} onClick={() => void act("approve", picked)}>
                Approve {picked.length || ""} picked
              </button>
              <button className="btn small" type="button" disabled={busy || !picked.length} onClick={() => void act("reject", picked)}>
                Reject {picked.length || ""} picked
              </button>
            </div>
          ) : (
            <p className="note">Nothing waiting. Drafts from a worldbuilding chat show up here.</p>
          )}
          {[...groups.entries()].map(([k, list]) => (
            <section key={k} className="builder-batch">
              <div className="inline">
                <h3>
                  {list[0].label} &middot; {when(list[0].createdAt)} &middot; {list.length} {list.length === 1 ? "draft" : "drafts"}
                </h3>
                <span className="spacer" />
                <button className="btn small" type="button" disabled={busy} onClick={() => setPicked((p) => [...new Set([...p, ...list.map((d) => d.id)])])}>
                  Pick all
                </button>
                <button className="btn small primary" type="button" disabled={busy} onClick={() => void act("approve", list.filter((d) => !d.diff?.stale && !d.diff?.gone).map((d) => d.id))}>
                  Approve all
                </button>
                <button className="btn small" type="button" disabled={busy} onClick={() => void act("reject", list.map((d) => d.id))}>
                  Reject all
                </button>
              </div>
              {list.map((d) => (
                <DraftCard
                  key={d.id}
                  draft={d}
                  busy={busy}
                  picked={picked.includes(d.id)}
                  onPick={(on) => setPicked((p) => (on ? [...p, d.id] : p.filter((x) => x !== d.id)))}
                  onApprove={() => void act("approve", [d.id])}
                  onReject={() => void act("reject", [d.id])}
                  onEdit={async (b) => (await edit(d.id, b)) && (await act("approve", [d.id]), true)}
                />
              ))}
            </section>
          ))}
          {reviewed.length ? (
            <details className="box">
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
    </div>
  );
}
