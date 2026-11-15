"use client";

import { useState } from "react";
import { formatCp } from "@/shared/money";
import type { DmPlayer } from "@/shared/projection";
import { absoluteHref } from "../api";
import { LinkIcon, LockIcon } from "../ui/icons";
import { useDm } from "./context";
import { seatedCount, seatsOf } from "@/shared/seed";
import { Field } from "./Field";
import { Check } from "./Check";
import { InspireToggle } from "./InspireToggle";
import { PageHead } from "./PageHead";
import { Drawer } from "./Drawer";
import { MenuItem, RowMenu } from "./RowMenu";
import { PlusIcon } from "./navIcons";

function seenText(t?: number | null) {
  if (!t) return "never seen";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 2) return "here now";
  if (mins < 60) return `seen ${mins} min ago`;
  return `seen ${new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
}

export function PlayersPanel() {
  const { view, run, toast } = useDm();
  const s = view.state;
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const list = s.players.filter((p) => showArchived || !p.archived);
  const archivedCount = s.players.filter((p) => p.archived).length;
  const away = s.players.filter((p) => !p.archived && p.away).length;
  const editingPlayer = s.players.find((p) => p.id === editing) as DmPlayer | undefined;

  const copyAll = () => {
    const text = [`TV: ${absoluteHref(view.state.id, "TV")}`, ...s.players.filter((p) => !p.archived).map((p) => `${p.name}: ${absoluteHref(view.state.id, p.handle)}`)].join("\n");
    void navigator.clipboard?.writeText(text).then(
      () => toast("Copied the TV and every player link."),
      () => toast("Couldn't copy."),
    );
  };

  return (
    <div className="players-panel pg">
      <PageHead
        title="Players"
        sub="Who's at the table, their links, and who can join."
        help={
          <>
            <p>
              Anyone who opens <code>{absoluteHref(view.state.id, "their-name")}</code> joins straight away while the door is open. Close the door, or fill every seat, and new names knock instead. You can always let someone in.
            </p>
            <p>Players who &ldquo;left the table&rdquo; don&rsquo;t hold a seat, and their ledger lines stay. Add &amp;key=anything to a player&rsquo;s link to lock the name to them.</p>
          </>
        }
        actions={
          <>
            <button className="btn" type="button" onClick={copyAll}>
              <LinkIcon size={16} /> Copy all links
            </button>
            <button className="btn primary" type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
              <PlusIcon size={16} /> Add player
            </button>
          </>
        }
        stats={[
          { label: "Seats", value: `${seatedCount(s)} of ${seatsOf(s)}`, tone: seatedCount(s) >= seatsOf(s) ? "warn" : undefined },
          { label: "Door", value: s.doorClosed ? "Closed" : "Open", tone: s.doorClosed ? "muted" : "ok" },
          ...(s.knocks.length ? [{ label: "Knocking", value: s.knocks.length, tone: "warn" as const }] : []),
          ...(away ? [{ label: "Away tonight", value: away, tone: "muted" as const }] : []),
        ]}
      />

      {adding ? (
        <form
          className="pg-inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run({ type: "player.add", name }, `Added ${name || "a player"}.`)) {
              setName("");
              setAdding(false);
            }
          }}
        >
          <input className="fld" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="New player's name" aria-label="New player's name" onKeyDown={(e) => e.key === "Escape" && setAdding(false)} />
          <button className="btn primary" type="submit">
            Add
          </button>
          <button className="btn ghost" type="button" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : null}

      <div className="pg-toolbar">
        <div className="seg" role="group" aria-label="The door">
          <button type="button" className={`btn small${s.doorClosed ? "" : " on"}`} aria-pressed={!s.doorClosed} onClick={() => s.doorClosed && run({ type: "door.set", closed: false }, "Door open.")}>
            Door open
          </button>
          <button type="button" className={`btn small${s.doorClosed ? " on" : ""}`} aria-pressed={s.doorClosed} onClick={() => !s.doorClosed && run({ type: "door.set", closed: true }, "Door closed. New names will knock.")}>
            Closed
          </button>
        </div>
        <label className="pg-toolbar-field">
          Seats
          <select className="fld" value={seatsOf(s)} onChange={(e) => run({ type: "table.seats", max: Number(e.target.value) }, `The table now seats ${e.target.value}.`)}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="grow" />
        {archivedCount ? (
          <label className="check">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show {archivedCount} who left
          </label>
        ) : null}
      </div>

      <ol className="scene-list pg-list">
        {list.map((p) => (
          <PlayerRow key={p.id} p={p as DmPlayer} onEdit={() => setEditing(p.id)} selected={editing === p.id} />
        ))}
        {list.length === 0 ? <li className="pg-empty">No players yet. Anyone who opens their link with a new name joins automatically.</li> : null}
      </ol>

      {editingPlayer ? <PlayerDrawer p={editingPlayer} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function PlayerRow({ p, onEdit, selected }: { p: DmPlayer; onEdit: () => void; selected: boolean }) {
  const { view, run, toast } = useDm();
  const link = absoluteHref(view.state.id, p.handle);
  const copy = () =>
    void navigator.clipboard?.writeText(link).then(
      () => toast(`Copied ${p.name}'s link.`),
      () => toast(link),
    );
  const sub = [p.character, `?player=${p.handle}`, seenText(p.lastSeenAt)].filter(Boolean).join(" · ");
  return (
    <li className={`scene-item list-row player-row${p.archived ? " archived" : ""}${p.away ? " away" : ""}${selected ? " selected" : ""}`}>
      <div className="scene-row">
        <span className="pg-avatar" aria-hidden="true">
          {p.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <button type="button" className="row-main" onClick={onEdit} title={`Edit ${p.name}`}>
          <span className="row-title">{p.name}</span>
          <span className="row-sub">{sub}</span>
        </button>
        <span className="row-meta">
          {p.away ? <span className="tag">away</span> : null}
          {p.dropIn ? <span className="tag">drop-in</span> : null}
          {p.hasKey ? (
            <span className="tag" title="Name locked to their device">
              <LockIcon size={12} /> locked
            </span>
          ) : null}
          {p.archived ? <span className="tag">left</span> : null}
          <span className="pg-money">{formatCp(p.balanceCp)}</span>
        </span>
        <InspireToggle playerId={p.id} name={p.name} on={!!p.inspired} compact />
        <button className="btn small" type="button" onClick={copy} title={link}>
          <LinkIcon size={14} /> Link
        </button>
        <RowMenu label={p.name}>
          <MenuItem onClick={onEdit}>Edit</MenuItem>
          <MenuItem onClick={() => run({ type: "player.update", playerId: p.id, patch: { away: !p.away } })}>{p.away ? "Back tonight" : "Away tonight"}</MenuItem>
          <MenuItem onClick={() => run({ type: "player.update", playerId: p.id, patch: { dropIn: !p.dropIn } })}>{p.dropIn ? "Not a drop-in" : "Mark as drop-in"}</MenuItem>
          {p.dndbUrl ? <MenuItem onClick={() => window.open(p.dndbUrl!, "_blank", "noopener,noreferrer")}>Open D&amp;D Beyond</MenuItem> : null}
          {p.hasKey ? <MenuItem onClick={() => run({ type: "player.clearKey", playerId: p.id }, `${p.name}'s name is unlocked.`)}>Reset name lock</MenuItem> : null}
          <MenuItem onClick={() => run({ type: "player.archive", playerId: p.id, archived: !p.archived })}>{p.archived ? "Bring back" : "Left the table"}</MenuItem>
        </RowMenu>
      </div>
    </li>
  );
}

function PlayerDrawer({ p, onClose }: { p: DmPlayer; onClose: () => void }) {
  const { view, run, toast } = useDm();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const link = absoluteHref(view.state.id, p.handle);
  return (
    <Drawer title={p.name} subtitle={`${formatCp(p.balanceCp)} · ${seenText(p.lastSeenAt)}`} onClose={onClose}>
      <div className="form">
        <Field label="Name" value={p.name} onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { name: v } })} />
        <Field label="Character name" value={p.character ?? ""} placeholder="Signs their Chronicle notes" onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { character: v } })} />
        <Field label="URL name (?player=)" value={p.handle} onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { handle: v } })} />
        <Field label="D&D Beyond character link" value={p.dndbUrl ?? ""} placeholder="https://www.dndbeyond.com/characters/..." onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { dndbUrl: v } })} />
        <div className="drawer-row">
          <code className="drawer-link">{link}</code>
          <button
            className="btn small"
            type="button"
            onClick={() =>
              void navigator.clipboard?.writeText(link).then(
                () => toast(`Copied ${p.name}'s link.`),
                () => toast(link),
              )
            }
          >
            <LinkIcon size={14} /> Copy
          </button>
        </div>
        <div className="drawer-checks">
          <Check checked={p.away} onChange={(v) => run({ type: "player.update", playerId: p.id, patch: { away: v } })}>
            Away tonight
          </Check>
          <Check checked={p.dropIn} onChange={(v) => run({ type: "player.update", playerId: p.id, patch: { dropIn: v } })}>
            Drop-in
          </Check>
          <InspireToggle playerId={p.id} name={p.name} on={!!p.inspired} />
        </div>
      </div>
      <section className="box danger-zone">
        <h3>{p.name}</h3>
        <div className="inline">
          {p.hasKey ? (
            <button className="btn small" type="button" onClick={() => run({ type: "player.clearKey", playerId: p.id }, `${p.name}'s name is unlocked.`)}>
              Reset name lock
            </button>
          ) : null}
          <button className="btn small" type="button" onClick={() => run({ type: "player.archive", playerId: p.id, archived: !p.archived })}>
            {p.archived ? "Bring back" : "Left the table"}
          </button>
          {confirmDelete ? (
            <>
              <button className="btn small" type="button" onClick={() => setConfirmDelete(false)}>
                Keep
              </button>
              <button
                className="btn small danger"
                type="button"
                onClick={async () => {
                  if (await run({ type: "player.remove", playerId: p.id }, `Deleted ${p.name}.`)) onClose();
                }}
              >
                Delete {p.name} (ledger lines stay)
              </button>
            </>
          ) : (
            <button className="btn small danger" type="button" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          )}
        </div>
      </section>
    </Drawer>
  );
}
