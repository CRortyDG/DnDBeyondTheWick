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

export function PlayersPanel() {
  const { view, run, toast } = useDm();
  const s = view.state;
  const [name, setName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const list = s.players.filter((p) => showArchived || !p.archived);
  const archivedCount = s.players.filter((p) => p.archived).length;

  return (
    <div className="players-panel">
      <section className="box door">
        <h3>The door</h3>
        <p className="note">
          Anyone who opens <code>{absoluteHref(view.state.id, "their-name")}</code> joins the table straight away. Close the door to make new names knock first.
        </p>
        <Check checked={s.doorClosed} onChange={(v) => run({ type: "door.set", closed: v }, v ? "Door closed. New names will knock." : "Door open.")}>
          Close the door
        </Check>
        <div className="inline seats">
          <label>
            Seats at the table
            <select className="fld" value={seatsOf(s)} onChange={(e) => run({ type: "table.seats", max: Number(e.target.value) }, `The table now seats ${e.target.value}.`)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span className="note">
            {seatedCount(s)} of {seatsOf(s)} taken. When every seat is taken, new names knock. You can always let someone in, and players who &ldquo;left the table&rdquo; don&rsquo;t hold a seat.
          </span>
        </div>
        {s.knocks.length ? (
          <ul className="knock-list">
            {s.knocks.map((k) => (
              <li key={k.id}>
                <b>{k.handle}</b> is knocking
                <button className="btn small primary" type="button" onClick={() => run({ type: "knock.admit", knockId: k.id }, `Let ${k.handle} in.`)}>
                  Let in
                </button>
                <button className="btn small" type="button" onClick={() => run({ type: "knock.dismiss", knockId: k.id })}>
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="player-cards">
        {list.map((p) => (
          <PlayerCard key={p.id} p={p} />
        ))}
      </div>

      <div className="inline">
        <form
          className="inline"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run({ type: "player.add", name }, `Added ${name || "a player"}.`)) setName("");
          }}
        >
          <label>
            New player
            <input className="fld" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          </label>
          <button className="btn" type="submit">
            Add player
          </button>
        </form>
        {archivedCount ? (
          <label className="check">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show {archivedCount} who left
          </label>
        ) : null}
      </div>
      <p className="note">Players can also just open their link with a new name. Add &amp;key=anything to their link to lock the name to them.</p>
      <CopyAll toast={toast} />
    </div>
  );
}

function PlayerCard({ p }: { p: DmPlayer }) {
  const { view, run, toast } = useDm();
  const link = absoluteHref(view.state.id, p.handle);
  const seen = p.lastSeenAt ? new Date(p.lastSeenAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "never";
  return (
    <section className={`box player-card${p.archived ? " archived" : ""}`}>
      <div className="box-head">
        <h3>{p.name}</h3>
        <span className="bal">{formatCp(p.balanceCp)}</span>
      </div>
      <div className="tags">
        {p.dropIn ? <span className="tag">drop-in</span> : null}
        {p.away ? <span className="tag">away tonight</span> : null}
        {p.archived ? <span className="tag">left the table</span> : null}
        {p.hasKey ? (
          <span className="tag">
            <LockIcon size={14} /> name locked
          </span>
        ) : null}
        <span className="note">last seen {seen}</span>
      </div>
      <div className="form">
        <div className="inline">
          <Field label="Name" value={p.name} onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { name: v } })} />
          <Field label="URL name (?player=)" value={p.handle} onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { handle: v } })} />
          <Field label="Character name" value={p.character ?? ""} placeholder="Signs their Chronicle notes" onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { character: v } })} />
        </div>
        <Field label="D&D Beyond character link" value={p.dndbUrl ?? ""} placeholder="https://www.dndbeyond.com/characters/..." onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { dndbUrl: v } })} />
        <div className="inline">
          <button
            className="btn small"
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(link).then(
                () => toast(`Copied ${p.name}'s link.`),
                () => toast(link),
              );
            }}
          >
            <LinkIcon size={16} /> Copy link
          </button>
          {p.dndbUrl ? (
            <a className="btn small" href={p.dndbUrl} target="_blank" rel="noopener noreferrer">
              D&amp;D Beyond
            </a>
          ) : null}
          <Check checked={p.away} onChange={(v) => run({ type: "player.update", playerId: p.id, patch: { away: v } })}>
            Away tonight
          </Check>
          <Check checked={p.dropIn} onChange={(v) => run({ type: "player.update", playerId: p.id, patch: { dropIn: v } })}>
            Drop-in
          </Check>
          <InspireToggle playerId={p.id} name={p.name} on={!!p.inspired} />
        </div>
        <div className="inline">
          {p.hasKey ? (
            <button className="btn small" type="button" onClick={() => run({ type: "player.clearKey", playerId: p.id }, `${p.name}'s name is unlocked.`)}>
              Reset name lock
            </button>
          ) : null}
          <button className="btn small" type="button" onClick={() => run({ type: "player.archive", playerId: p.id, archived: !p.archived })}>
            {p.archived ? "Bring back" : "Left the table"}
          </button>
          <button
            className="btn small danger"
            type="button"
            onClick={() => {
              if (confirm(`Delete ${p.name}? Their ledger lines stay.`)) void run({ type: "player.remove", playerId: p.id }, `Deleted ${p.name}.`);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </section>
  );
}

function CopyAll({ toast }: { toast: (m: string) => void }) {
  const { view } = useDm();
  const text = [
    `TV: ${absoluteHref(view.state.id, "TV")}`,
    ...view.state.players.filter((p) => !p.archived).map((p) => `${p.name}: ${absoluteHref(view.state.id, p.handle)}`),
  ].join("\n");
  return (
    <button
      className="btn"
      type="button"
      onClick={() =>
        void navigator.clipboard?.writeText(text).then(
          () => toast("Copied every link."),
          () => toast("Couldn't copy."),
        )
      }
    >
      <LinkIcon size={16} /> Copy the TV and player links
    </button>
  );
}
