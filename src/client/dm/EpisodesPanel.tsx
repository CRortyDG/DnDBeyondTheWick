"use client";

// Episodes: create, edit, reorder, import and export run sheets. DM-only.

import { useState } from "react";
import { curRunEpisode } from "@/shared/reducer";
import {
  actionMarkdown,
  beatMarkdown,
  episodeMarkdown,
  parseEpisode,
  sceneResolver,
  type ParsedEpisode,
} from "@/shared/runsheet";
import type { Beat, BeatAction, Episode, Scene } from "@/shared/types";
import { DownIcon, UpIcon } from "../ui/icons";
import { useDm } from "./context";
import { Field } from "./Field";
import { actionLabel } from "./RunGame";

// A made-up example: the browser bundle must not carry any real episode text.
const FORMAT_HELP = `## The toll bridge
> "Nobody crosses without paying."
- Notes are bullet lines.
check: Charisma (Persuasion) DC 12 | talk the toll down | fail: the price doubles
if: they pay → the troll waves them through
action: black`;

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
  const ep = episodes.find((e) => e.id === openId) ?? episodes[0];

  return (
    <div className="episodes-panel panel">
      <section className="box">
        <div className="box-head">
          <h3>Episodes</h3>
          <span className="note">
            Run sheets are DM-only. The TV only sees what their actions do.
          </span>
        </div>
        <div className="tabs" role="group" aria-label="Episodes">
          {episodes.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`btn small${ep?.id === e.id ? " on" : ""}`}
              aria-pressed={ep?.id === e.id}
              onClick={() => setOpenId(e.id)}
            >
              {e.title}
            </button>
          ))}
        </div>
        <form
          className="inline"
          style={{ marginTop: 12 }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await run(
                {
                  type: "episode.add",
                  title: newTitle.trim() || "New episode",
                },
                "Episode added.",
              )
            )
              setNewTitle("");
          }}
        >
          <label className="grow">
            New episode
            <input
              className="fld"
              value={newTitle}
              placeholder="Episode 2: …"
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </label>
          <button className="btn" type="submit">
            Add episode
          </button>
          <button
            className="btn"
            type="button"
            aria-expanded={importing}
            onClick={() => setImporting((v) => !v)}
          >
            Import Markdown
          </button>
        </form>
        {importing ? (
          <ImportBox episode={ep} onDone={() => setImporting(false)} />
        ) : null}
      </section>

      {ep ? (
        <EpisodeEditor
          key={ep.id}
          ep={ep}
          onRun={onRun}
          running={curRunEpisode(s) === ep.id}
        />
      ) : (
        <p className="note">No episodes yet.</p>
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
    ? parseEpisode(md, sceneResolver(view.state.scenes))
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
        <code>if:</code> … → … · <code>action:</code> scene &lt;name&gt;, black
        or bank. A <code># Title</code> line names the episode.
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
  const md = exporting ? episodeMarkdown(ep, s.scenes) : "";

  return (
    <section className="box">
      <div className="box-head">
        <h3>{ep.title}</h3>
        <span className="note">{ep.beats.length} beats</span>
      </div>
      <div className="inline">
        <div className="grow">
          <Field
            label="Title"
            value={ep.title}
            onCommit={(v) =>
              v.trim()
                ? run({ type: "episode.update", episodeId: ep.id, title: v })
                : false
            }
          />
        </div>
        <button
          className="btn primary"
          type="button"
          onClick={() => onRun(ep.id)}
        >
          {running ? "Resume run-game" : "Run this episode"}
        </button>
        <button
          className="btn"
          type="button"
          aria-expanded={exporting}
          onClick={() => setExporting((v) => !v)}
        >
          Export Markdown
        </button>
        {confirmDelete === ep.id ? (
          <button
            className="btn danger"
            type="button"
            onClick={() =>
              run(
                { type: "episode.remove", episodeId: ep.id },
                "Episode deleted.",
              )
            }
          >
            Really delete the episode?
          </button>
        ) : (
          <button
            className="btn danger"
            type="button"
            onClick={() => setConfirmDelete(ep.id)}
          >
            Delete episode
          </button>
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

      <ol className="beat-list">
        {ep.beats.map((b, i) => (
          <li
            key={b.id}
            className={`scene-item beat-item${dragId === b.id ? " dragging" : ""}`}
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
              <span
                className="drag-handle"
                aria-hidden="true"
                title="Drag to reorder"
              >
                ⠿
              </span>
              <span className="key">{i + 1}</span>
              <span className="scene-label">{b.title}</span>
              <span className="note beat-summary">
                {[
                  b.readAloud?.length ? "read-aloud" : "",
                  b.checks.length
                    ? `${b.checks.length} check${b.checks.length === 1 ? "" : "s"}`
                    : "",
                  ...b.actions.map((a) => actionLabel(a, s.scenes)),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="spacer" />
              <button
                className="btn small icon"
                type="button"
                aria-label={`Move ${b.title} up`}
                disabled={i === 0}
                onClick={() =>
                  run({
                    type: "beat.move",
                    episodeId: ep.id,
                    beatId: b.id,
                    to: i - 1,
                  })
                }
              >
                <UpIcon />
              </button>
              <button
                className="btn small icon"
                type="button"
                aria-label={`Move ${b.title} down`}
                disabled={i === ep.beats.length - 1}
                onClick={() =>
                  run({
                    type: "beat.move",
                    episodeId: ep.id,
                    beatId: b.id,
                    to: i + 1,
                  })
                }
              >
                <DownIcon />
              </button>
              <button
                className="btn small"
                type="button"
                aria-expanded={editing === b.id}
                onClick={() => setEditing(editing === b.id ? null : b.id)}
              >
                {editing === b.id ? "Close" : "Edit"}
              </button>
              {confirmDelete === b.id ? (
                <button
                  className="btn small danger"
                  type="button"
                  onClick={() =>
                    run({ type: "beat.remove", episodeId: ep.id, beatId: b.id })
                  }
                >
                  Really delete?
                </button>
              ) : (
                <button
                  className="btn small danger"
                  type="button"
                  onClick={() => setConfirmDelete(b.id)}
                >
                  Delete
                </button>
              )}
            </div>
            {editing === b.id ? (
              <BeatEditor
                episodeId={ep.id}
                beat={b}
                onDone={() => setEditing(null)}
              />
            ) : (
              <ActionsPicker
                actions={b.actions}
                scenes={s.scenes}
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
      {editing === "__new__" ? (
        <div className="scene-item beat-item">
          <BeatEditor episodeId={ep.id} onDone={() => setEditing(null)} />
        </div>
      ) : (
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
    beat ? beatMarkdown(beat, view.state.scenes) : NEW_BEAT,
  );
  const parsed = parseEpisode(md, sceneResolver(view.state.scenes), "");
  const one = parsed.beats.length === 1 ? parsed.beats[0] : null;
  return (
    <div className="beat-editor">
      <textarea
        className="fld mono"
        rows={Math.min(24, Math.max(6, md.split("\n").length + 1))}
        value={md}
        onChange={(e) => setMd(e.target.value)}
        aria-label={beat ? `Edit ${beat.title}` : "New beat"}
      />
      {one ? (
        <ActionsPicker
          actions={one.actions}
          scenes={view.state.scenes}
          onChange={(actions) =>
            setMd(withActions(md, actions, view.state.scenes))
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

/** Swap a beat's "action:" lines for these, keeping everything else as typed. */
function withActions(
  md: string,
  actions: BeatAction[],
  scenes: Scene[],
): string {
  const kept = md
    .replace(/\s+$/, "")
    .split("\n")
    .filter((l) => !/^\s*action\s*:/i.test(l));
  const lines = actions
    .map((a) => actionMarkdown(a, scenes))
    .filter((l): l is string => !!l);
  return [...kept, ...lines].join("\n") + "\n";
}

/** What landing on this beat does to the TV: pick a scene, the black screen or the bank. */
function ActionsPicker({
  actions,
  scenes,
  onChange,
}: {
  actions: BeatAction[];
  scenes: Scene[];
  onChange: (a: BeatAction[]) => void;
}) {
  const [pick, setPick] = useState("");
  const add = (v: string) => {
    if (!v) return;
    const a: BeatAction =
      v === "black"
        ? { type: "black" }
        : v === "bank"
          ? { type: "bank" }
          : { type: "scene", sceneId: v.slice(6) };
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
      {actions.length ? null : <span className="note">nothing on the TV</span>}
      {actions.map((a, i) => (
        <span key={i} className="beat-action-chip">
          {actionLabel(a, scenes)}
          <button
            type="button"
            className="chip-x"
            aria-label={`Remove ${actionLabel(a, scenes)}`}
            onClick={() => onChange(actions.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </span>
      ))}
      {actions.length < 10 ? (
        <select
          className="fld small-select"
          aria-label="Add a TV action"
          value={pick}
          onChange={(e) => add(e.target.value)}
        >
          <option value="">+ Add a TV action…</option>
          <optgroup label="Show a scene">
            {scenes
              .filter((sc) => sc.kind !== "black")
              .map((sc) => (
                <option key={sc.id} value={`scene:${sc.id}`}>
                  {sc.label}
                </option>
              ))}
          </optgroup>
          <option value="black">Black screen</option>
          <option value="bank">
            Bank (purse on the TV, bank on your screen)
          </option>
        </select>
      ) : null}
    </div>
  );
}
