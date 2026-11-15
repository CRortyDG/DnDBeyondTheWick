"use client";

// Episodes: create, edit, reorder, import and export run sheets. DM-only.

import { useState } from "react";
import { curRunEpisode } from "@/shared/reducer";
import {
  actionMarkdown,
  beatMarkdown,
  episodeMarkdown,
  parseEpisode,
  assetResolver,
  type ParsedEpisode,
} from "@/shared/runsheet";
import type { Beat, BeatAction, Episode } from "@/shared/types";
import { beatSuggestions, listAssets, resolveRef, type AssetGame } from "@/shared/assets";
import { DownIcon, UpIcon } from "../ui/icons";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { PlayIcon, PlusIcon } from "./navIcons";
import { Drawer } from "./Drawer";
import { MenuItem, RowMenu } from "./RowMenu";
import { monstersOf } from "@/shared/combat";
import { Field } from "./Field";
import { actionLabel } from "./RunGame";
import { AddStoryBeat, CastAndPrep, MentionTextarea, StoryBlocks } from "./EpisodeBuilder";
import { CluesEditor } from "./OffScript";
import { storyResolver } from "@/shared/runsheet";

// A made-up example: the browser bundle must not carry any real episode text.
const FORMAT_HELP = `## The toll bridge
> "Nobody crosses without paying."
- Notes are bullet lines.
check: Charisma (Persuasion) DC 12 | talk the toll down | fail: the price doubles
if: they pay → the troll waves them through
show: black`;

export function EpisodesPanel({
  onRun,
}: {
  onRun: (episodeId: string) => void;
}) {
  const { view, run } = useDm();
  const s = view.state;
  const episodes = s.episodes ?? [];
  const [openId, setOpenId] = useState<string | null>(episodes[0]?.id ?? null);
  const [newTitle, setNewTitle] = useState("");
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const ep = episodes.find((e) => e.id === openId) ?? episodes[0];

  const runningId = curRunEpisode(s);
  const runningEp = episodes.find((e) => e.id === runningId);

  return (
    <div className="episodes-panel pg">
      <PageHead
        title="Episodes"
        sub="Run sheets: beats, read-aloud, checks and what the TV does."
        help={<p>Run sheets are DM-only. The TV only sees what their actions do. Import an episode written in Markdown (one beat per &ldquo;##&rdquo;), or build it beat by beat. Drag beats to reorder them.</p>}
        actions={
          <>
            <button className={`btn${importing ? " on" : ""}`} type="button" aria-expanded={importing} onClick={() => setImporting((v) => !v)}>
              Import Markdown
            </button>
            <button className="btn primary" type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
              <PlusIcon size={16} /> Episode
            </button>
          </>
        }
        stats={[
          { label: "Episodes", value: episodes.length },
          ...(ep ? [{ label: "Beats here", value: ep.beats.length }] : []),
          ...(runningEp ? [{ label: "Running", value: runningEp.title, tone: "gold" as const }] : []),
        ]}
      />

      {adding ? (
        <form
          className="pg-inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run({ type: "episode.add", title: newTitle.trim() || "New episode" }, "Episode added.")) {
              setNewTitle("");
              setAdding(false);
            }
          }}
        >
          <input className="fld" autoFocus value={newTitle} placeholder="Episode 2: …" aria-label="New episode title" onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setAdding(false)} />
          <button className="btn primary" type="submit">
            Add episode
          </button>
          <button className="btn ghost" type="button" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : null}

      {importing ? (
        <section className="box pg-card">
          <ImportBox episode={ep} onDone={() => setImporting(false)} />
        </section>
      ) : null}

      {episodes.length > 1 ? (
        <div className="seg ep-switch" role="group" aria-label="Episodes">
          {episodes.map((e) => (
            <button key={e.id} type="button" className={`btn small${ep?.id === e.id ? " on" : ""}`} aria-pressed={ep?.id === e.id} onClick={() => setOpenId(e.id)}>
              {e.title}
              {e.id === runningId ? <span className="ep-live" aria-label="running" /> : null}
            </button>
          ))}
        </div>
      ) : null}

      {ep ? (
        <EpisodeEditor
          key={ep.id}
          ep={ep}
          onRun={onRun}
          running={curRunEpisode(s) === ep.id}
        />
      ) : (
        <p className="pg-empty">No episodes yet. Add one, or import one written in Markdown.</p>
      )}
    </div>
  );
}

function ImportBox({
  episode,
  onDone,
}: {
  episode?: Episode;
  onDone: () => void;
}) {
  const { view, run } = useDm();
  const [md, setMd] = useState("");
  const [into, setInto] = useState<"new" | "replace">("new");
  const parsed: ParsedEpisode | null = md.trim()
    ? parseEpisode(md, assetResolver(view.state), undefined, storyResolver(view.state))
    : null;
  return (
    <div className="import-box">
      <label className="form">
        Paste an episode: one beat per &ldquo;##&rdquo;
        <textarea
          className="fld mono"
          rows={10}
          value={md}
          placeholder={FORMAT_HELP}
          onChange={(e) => setMd(e.target.value)}
        />
      </label>
      <p className="note">
        Lines: <code>&gt;</code> read-aloud · <code>-</code> note ·{" "}
        <code>check:</code> skill DC n | what | fail: … | success: … ·{" "}
        <code>if:</code> … → … · <code>show:</code> a name or ref (person/mags, map/candlefair/3, prop/the-symbol, black, stinger) ·{" "}
        <code>action:</code> bank · <code>reveal:</code> person/fennick · <code>fight:</code> Goblin x2, Orc (monsters from the Monsters tab). A <code># Title</code> line names the episode.
      </p>
      {parsed ? (
        <div className="import-preview">
          <p>
            <b>{parsed.title}</b>: {parsed.beats.length} beat
            {parsed.beats.length === 1 ? "" : "s"},{" "}
            {parsed.beats.reduce((n, b) => n + b.checks.length, 0)} checks,{" "}
            {parsed.beats.reduce((n, b) => n + b.branches.length, 0)} branches,{" "}
            {parsed.beats.reduce((n, b) => n + b.actions.length, 0)} actions.
          </p>
          {parsed.warnings.length ? (
            <ul className="import-warnings">
              {parsed.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}
          <div className="inline">
            {episode ? (
              <>
                <label className="check">
                  <input
                    type="radio"
                    name="into"
                    checked={into === "new"}
                    onChange={() => setInto("new")}
                  />{" "}
                  As a new episode
                </label>
                <label className="check">
                  <input
                    type="radio"
                    name="into"
                    checked={into === "replace"}
                    onChange={() => setInto("replace")}
                  />{" "}
                  Replace the beats of &ldquo;{episode.title}&rdquo;
                </label>
              </>
            ) : null}
            <button
              className="btn primary"
              type="button"
              disabled={!parsed.beats.length}
              onClick={async () => {
                const ok =
                  into === "replace" && episode
                    ? await run(
                        {
                          type: "episode.replaceBeats",
                          episodeId: episode.id,
                          beats: parsed.beats,
                        },
                        `Imported ${parsed.beats.length} beats.`,
                      )
                    : await run(
                        {
                          type: "episode.add",
                          title: parsed.title,
                          beats: parsed.beats,
                        },
                        `Imported “${parsed.title}”.`,
                      );
                if (ok) onDone();
              }}
            >
              Import {parsed.beats.length} beats
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EpisodeEditor({
  ep,
  onRun,
  running,
}: {
  ep: Episode;
  onRun: (id: string) => void;
  running: boolean;
}) {
  const { view, run, toast } = useDm();
  const s = view.state;
  const [editing, setEditing] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const md = exporting ? episodeMarkdown(ep, s) : "";
  const pending = ep.beats.filter((b) => beatSuggestions(s, b).suggested).length;

  return (
    <section className="box ep-card">
      <div className="ep-head">
        <div className="grow">
          <Field label="Title" value={ep.title} onCommit={(v) => (v.trim() ? run({ type: "episode.update", episodeId: ep.id, title: v }) : false)} />
        </div>
        {pending ? (
          <button className="btn" type="button" title="Each beat with no TV action shows the first thing it mentions" onClick={() => run({ type: "episode.acceptSuggestions", episodeId: ep.id })}>
            Accept {pending} suggestion{pending === 1 ? "" : "s"}
          </button>
        ) : null}
        <button className="btn primary" type="button" onClick={() => onRun(ep.id)}>
          <PlayIcon size={14} /> {running ? "Resume" : "Run this episode"}
        </button>
        {confirmDelete === ep.id ? (
          <>
            <button className="btn" type="button" onClick={() => setConfirmDelete(null)}>
              Keep it
            </button>
            <button className="btn danger" type="button" onClick={() => run({ type: "episode.remove", episodeId: ep.id }, "Episode deleted.")}>
              Delete {ep.title}
            </button>
          </>
        ) : (
          <RowMenu label={ep.title}>
            <MenuItem onClick={() => setExporting((v) => !v)}>{exporting ? "Hide Markdown" : "Export as Markdown"}</MenuItem>
            <MenuItem danger onClick={() => setConfirmDelete(ep.id)}>
              Delete episode
            </MenuItem>
          </RowMenu>
        )}
      </div>
      {exporting ? (
        <div className="import-box">
          <textarea
            className="fld mono"
            rows={12}
            readOnly
            value={md}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            className="btn"
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(md);
                toast("Copied the episode as Markdown.");
              } catch {
                toast("Couldn't copy. Select the text and copy it yourself.");
              }
            }}
          >
            Copy
          </button>
        </div>
      ) : null}

      <CastAndPrep ep={ep} />
      <CluesEditor episodeId={ep.id} />

      <ol className="beat-list scene-list">
        {ep.beats.map((b, i) => (
          <li
            key={b.id}
            className={`scene-item list-row beat-item${dragId === b.id ? " dragging" : ""}${editing === b.id ? " selected" : ""}`}
            draggable={editing !== b.id}
            onDragStart={(e) => {
              setDragId(b.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", b.id);
            }}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => {
              if (dragId) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = dragId ?? e.dataTransfer.getData("text/plain");
              setDragId(null);
              if (id && id !== b.id)
                void run({
                  type: "beat.move",
                  episodeId: ep.id,
                  beatId: id,
                  to: i,
                });
            }}
          >
            <div className="scene-row">
              <span className="drag-handle" aria-hidden="true" title="Drag to reorder">
                ⠿
              </span>
              <span className="beat-num">{i + 1}</span>
              <button type="button" className="row-main" aria-expanded={editing === b.id} onClick={() => setEditing(editing === b.id ? null : b.id)} title={`Edit ${b.title}`}>
                <span className="row-title">{b.title}</span>
                <span className="row-sub">
                  {[b.readAloud?.length ? "Read-aloud" : "", b.checks.length ? `${b.checks.length} check${b.checks.length === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ")}
                </span>
              </button>
              {confirmDelete === b.id ? (
                <>
                  <button className="btn small" type="button" onClick={() => setConfirmDelete(null)}>
                    Keep it
                  </button>
                  <button className="btn small danger" type="button" onClick={() => run({ type: "beat.remove", episodeId: ep.id, beatId: b.id })}>
                    Delete {b.title}
                  </button>
                </>
              ) : null}
              <RowMenu label={b.title}>
                <MenuItem onClick={() => setEditing(editing === b.id ? null : b.id)}>{editing === b.id ? "Close the editor" : "Edit"}</MenuItem>
                <MenuItem disabled={i === 0} onClick={() => run({ type: "beat.move", episodeId: ep.id, beatId: b.id, to: i - 1 })}>
                  Move up
                </MenuItem>
                <MenuItem disabled={i === ep.beats.length - 1} onClick={() => run({ type: "beat.move", episodeId: ep.id, beatId: b.id, to: i + 1 })}>
                  Move down
                </MenuItem>
                <MenuItem danger onClick={() => setConfirmDelete(b.id)}>
                  Delete
                </MenuItem>
              </RowMenu>
            </div>
            {editing !== b.id ? <StoryBlocks episodeId={ep.id} beat={b} /> : null}
            {editing === b.id ? (
              <Drawer title={b.title} subtitle={`Beat ${i + 1} of ${ep.title}`} onClose={() => setEditing(null)} closeLabel="Close" wide>
                <BeatEditor episodeId={ep.id} beat={b} onDone={() => setEditing(null)} />
              </Drawer>
            ) : null}
            {editing === b.id ? null : (
              <ActionsPicker
                actions={b.actions}
                beat={b}
                onDismiss={(ref) => run({ type: "beat.dismiss", episodeId: ep.id, beatId: b.id, ref })}
                onChange={(actions) => {
                  const { id: _id, ...body } = b;
                  void run({
                    type: "beat.update",
                    episodeId: ep.id,
                    beatId: b.id,
                    beat: { ...body, actions },
                  });
                }}
              />
            )}
          </li>
        ))}
      </ol>
      <AddStoryBeat ep={ep} />
      {editing === "__new__" ? (
        <Drawer title="New beat" subtitle={ep.title} onClose={() => setEditing(null)} closeLabel="Cancel" wide>
          <BeatEditor episodeId={ep.id} onDone={() => setEditing(null)} />
        </Drawer>
      ) : null}
      {editing === "__new__" ? null : (
        <button
          className="btn"
          type="button"
          onClick={() => setEditing("__new__")}
        >
          Add a beat
        </button>
      )}
    </section>
  );
}

const NEW_BEAT =
  "## New beat\n> Read-aloud text (optional)\n- A note for you\n";

/** Edit one beat (or write a new one) in the same Markdown format as import. */
function BeatEditor({
  episodeId,
  beat,
  onDone,
}: {
  episodeId: string;
  beat?: Beat;
  onDone: () => void;
}) {
  const { view, run } = useDm();
  const [md, setMd] = useState(() =>
    beat ? beatMarkdown(beat, view.state) : NEW_BEAT,
  );
  const parsed = parseEpisode(md, assetResolver(view.state), "", storyResolver(view.state));
  const parsedOne = parsed.beats.length === 1 ? parsed.beats[0] : null;
  // Suggestions you said no to aren't in the Markdown; keep them.
  const one = parsedOne && beat?.dismissed?.length ? { ...parsedOne, dismissed: beat.dismissed } : parsedOne;
  return (
    <div className="beat-editor">
      <MentionTextarea
        rows={Math.min(24, Math.max(6, md.split("\n").length + 1))}
        value={md}
        onChange={setMd}
        label={beat ? `Edit ${beat.title}` : "New beat"}
      />
      <p className="note">Type @ to mention someone: @person/mags, @flyer/rolf, @monster/pudding-gremlin.</p>
      {one ? (
        <ActionsPicker
          actions={one.actions}
          beat={one}
          onChange={(actions) =>
            setMd(withActions(md, actions, view.state))
          }
        />
      ) : null}
      {parsed.beats.length > 1 ? (
        <p className="error-text">
          That&rsquo;s {parsed.beats.length} beats. Keep one &ldquo;##&rdquo;
          line here, or use Import for several.
        </p>
      ) : null}
      {parsed.warnings.filter((w) => !/before the first/.test(w)).length ? (
        <ul className="import-warnings">
          {parsed.warnings
            .filter((w) => !/before the first/.test(w))
            .map((w, i) => (
              <li key={i}>{w}</li>
            ))}
        </ul>
      ) : null}
      <div className="inline">
        <button
          className="btn primary"
          type="button"
          disabled={!one}
          onClick={async () => {
            if (!one) return;
            const ok = beat
              ? await run(
                  {
                    type: "beat.update",
                    episodeId,
                    beatId: beat.id,
                    beat: one,
                  },
                  "Beat saved.",
                )
              : await run(
                  { type: "beat.add", episodeId, beat: one },
                  "Beat added.",
                );
            if (ok) onDone();
          }}
        >
          {beat ? "Save beat" : "Add beat"}
        </button>
        <button className="btn" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Swap a beat's action lines (show, action, fight, reveal, rumor, fact) for these, keeping everything else as typed. */
function withActions(
  md: string,
  actions: BeatAction[],
  g: AssetGame,
): string {
  const kept = md
    .replace(/\s+$/, "")
    .split("\n")
    // Indented fact: lines belong to a "story:" line above them; keep those.
    .filter((l) => !/^(?:action|fight|show|reveal|rumor|fact)\s*:/i.test(l));
  const lines = actions
    .map((a) => actionMarkdown(a, g))
    .filter((l): l is string => !!l);
  return [...kept, ...lines].join("\n") + "\n";
}

/** What landing on this beat does to the TV: show something, the bank, a fight. Plus what its words suggest. */
function ActionsPicker({
  actions,
  beat,
  onChange,
  onDismiss,
}: {
  actions: BeatAction[];
  beat?: Pick<Beat, "title" | "readAloud" | "notes" | "checks" | "branches" | "actions" | "dismissed">;
  onChange: (a: BeatAction[]) => void;
  /** No: don't suggest this again (saved beats only). */
  onDismiss?: (ref: string) => void;
}) {
  const [pick, setPick] = useState("");
  const { view } = useDm();
  const g = view.state;
  const monsters = monstersOf(g);
  const assets = listAssets(g);
  const groups = [...new Set(assets.map((a) => a.group))];
  const sugg = beat ? beatSuggestions(g, { ...beat, actions }) : null;
  const suggested = sugg?.suggested ? resolveRef(g, sugg.suggested) : null;
  const add = (v: string) => {
    if (!v) return;
    const a: BeatAction = v.startsWith("fight:")
      ? { type: "fight", monsters: [{ name: v.slice(6), count: 1 }] }
      : v === "bank"
        ? { type: "bank" }
        : { type: "show", ref: v.slice(5) };
    onChange([...actions, a]);
    setPick("");
  };
  return (
    <div
      className="beat-actions"
      role="group"
      aria-label="TV actions when you land on this beat"
    >
      <span className="note">On landing:</span>
      {actions.length || suggested ? null : <span className="note">nothing on the TV</span>}
      {actions.map((a, i) => (
        <span key={i} className="beat-action-chip">
          {actionLabel(a, g)}
          <button
            type="button"
            className="chip-x"
            aria-label={`Remove ${actionLabel(a, g)}`}
            onClick={() => onChange(actions.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </span>
      ))}
      {suggested && actions.length < 10 ? (
        <span className="beat-action-chip suggested">
          <button
            type="button"
            className="linkish"
            title={`Add “show: ${suggested.ref}”: the beat mentions it`}
            onClick={() => onChange([...actions, { type: "show", ref: suggested.ref }])}
          >
            Suggested: {suggested.label} ✓
          </button>
          {onDismiss ? (
            <button
              type="button"
              className="chip-x"
              aria-label={`Don't suggest ${suggested.label} here`}
              onClick={() => onDismiss(suggested.ref)}
            >
              ×
            </button>
          ) : null}
        </span>
      ) : null}
      {actions.length < 10 ? (
        <select
          className="fld small-select"
          aria-label="Add a TV action"
          value={pick}
          onChange={(e) => add(e.target.value)}
        >
          <option value="">+ Add a TV action…</option>
          {groups.map((grp) => (
            <optgroup key={grp} label={`Show: ${grp.toLowerCase()}`}>
              {assets
                .filter((a) => a.group === grp)
                .map((a) => (
                  <option key={a.ref} value={`show:${a.ref}`}>
                    {a.label}
                  </option>
                ))}
            </optgroup>
          ))}
          <option value="bank">
            Bank (purse on the TV, bank on your screen)
          </option>
          {monsters.length ? (
            <optgroup label="Start a fight (set how many in the text)">
              {monsters.map((m) => (
                <option key={m.id} value={`fight:${m.name}`}>
                  Fight: {m.name}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      ) : null}
      {sugg?.also.length ? (
        <span className="note beat-also">
          Also mentioned (Shift+number while it runs): {sugg.also.map((r) => resolveRef(g, r)?.label ?? r).join(", ")}
        </span>
      ) : null}
    </div>
  );
}
