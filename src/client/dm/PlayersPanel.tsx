"use client";

import { LookEditor } from "../ui/LookEditor";
import { PixelLook } from "../ui/PixelLook";
import { RoomKey, RoomsBox, roomsOn } from "./Rooms";
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
import { LevelUpButton } from "./LevelUp";
import { Drawer } from "./Drawer";
import { MenuItem, RowMenu } from "./RowMenu";
import { PlusIcon } from "./navIcons";
import { CharacterSheetView } from "../ui/CharacterSheet";
import { sheetNumbers } from "@/shared/sheet";
import { featureOn, FEATURES, hiddenOf, playerOff } from "@/shared/features";
import { Switch } from "./FeaturesPanel";

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
  const [resting, setResting] = useState(false);
  const withSheets = s.players.filter((p) => !p.archived && p.sheet && !p.sheetOff);
  const sheetsOn = s.players.filter((p) => !p.archived && !p.sheetOff).length;
  const sheetCount = withSheets.length;
  const allLocked = sheetCount > 0 && withSheets.every((p) => p.sheet!.locked);
  const hurt = s.players.filter((p) => !p.archived && p.hp && p.hp.max > 0 && (p.hp.cur < p.hp.max || p.hp.temp > 0));
  const fightOpen = !!s.fight && s.fight.status !== "over";
  const longRest = async () => {
    setResting(false);
    await run({ type: "party.longRest" }, sheetCount ? "Long rest: full HP, and every slot, hit die and feature back on the sheets. Logged in the Chronicle." : "Long rest: everyone is back to full HP. Logged in the Chronicle.");
  };
  const shortRest = () => run({ type: "party.shortRest" }, sheetCount ? "Short rest: Pact slots and short-rest features are back. Players can spend hit dice on their sheets. Logged in the Chronicle." : "Short rest logged in the Chronicle.");

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
            {resting ? (
              <>
                <button className="btn" type="button" onClick={() => setResting(false)}>
                  Not yet
                </button>
                <button className="btn primary" type="button" onClick={() => void longRest()}>
                  Everyone to full HP
                </button>
              </>
            ) : (
              <button
                className="btn"
                type="button"
                disabled={fightOpen}
                title={fightOpen ? "End the fight first." : hurt.length ? `${hurt.map((p) => p.name).join(", ")} ${hurt.length === 1 ? "isn't" : "aren't"} at full HP.` : "Everyone is at full HP."}
                onClick={() => setResting(true)}
              >
                Long rest{hurt.length ? ` (${hurt.length} hurt)` : ""}
              </button>
            )}
            {resting ? null : (
              <button className="btn" type="button" disabled={fightOpen} title={fightOpen ? "End the fight first." : "Pact slots and short-rest features come back. Players spend hit dice on their phones."} onClick={() => void shortRest()}>
                Short rest
              </button>
            )}
            <LevelUpButton />
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
        {featureOn(s, "sheets") ? (
        <button
          className="btn small"
          type="button"
          title="Turn the app's character sheet on or off for everyone. You can still change it per player in their drawer."
          onClick={() => run({ type: "sheet.enable", on: sheetsOn === 0 }, sheetsOn === 0 ? "Sheets on for everyone." : "Sheets off for everyone. Their tab is Gold again.")}
        >
          {sheetsOn === 0 ? "Sheets on for all" : "Sheets off for all"}
        </button>
        ) : null}
        {sheetCount && featureOn(s, "sheets") ? (
          <button
            className="btn small"
            type="button"
            title="Locks class, scores and proficiencies on every sheet there is now. HP, conditions and notes stay open."
            onClick={() => run({ type: "sheet.lock", on: !allLocked }, allLocked ? "Sheets unlocked." : "Sheets locked: class, scores and proficiencies.")}
          >
            {allLocked ? "Unlock sheets" : "Lock sheets"}
          </button>
        ) : null}
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

      <RoomsBox />

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
  const hp = p.hp && p.hp.max > 0 ? `HP ${p.hp.cur}/${p.hp.max}${p.hp.temp ? ` +${p.hp.temp}` : ""}` : "";
  const nums = p.sheet && !p.sheetOff ? sheetNumbers(p.sheet, p.level) : null;
  const sub = [p.character, p.level ? `Level ${p.level}` : "", p.sheet?.cls ?? "", hp, nums ? `AC ${nums.ac} · PP ${nums.passive}` : "", `?player=${p.handle}`, seenText(p.lastSeenAt)].filter(Boolean).join(" · ");
  return (
    <li className={`scene-item list-row player-row${p.archived ? " archived" : ""}${p.away ? " away" : ""}${selected ? " selected" : ""}`}>
      <div className="scene-row">
        {p.look ? (
          <PixelLook look={p.look} face className="pg-avatar pg-look" />
        ) : (
          <span className="pg-avatar" aria-hidden="true">
            {p.name.trim().charAt(0).toUpperCase() || "?"}
          </span>
        )}
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
        <button className="btn small" type="button" onClick={copy} title={`Copy ${link}`}>
          <LinkIcon size={14} /> Copy link
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

/** Features for this player: the per-player switches (sheets, phone dice, shops), and the tabs they hid themselves. */
function PlayerFeatures({ p }: { p: DmPlayer }) {
  const { view, run } = useDm();
  const s = view.state;
  const per = FEATURES.filter((f) => f.perPlayer && featureOn(s, f.id));
  const hid = hiddenOf(p);
  if (!per.length && !hid.length) return null;
  const who = p.character || p.name;
  return (
    <section className="ft-player" aria-label={`Features for ${who}`}>
      <h3>Features for {who}</h3>
      <ul className="ft-subs">
        {per.map((f) => (
          <li key={f.id}>
            <span>{f.name}</span>
            <Switch
              on={!playerOff(p, f.id)}
              label={`${f.name} for ${who}`}
              onChange={(v) => run({ type: "features.player", playerId: p.id, feature: f.id, on: v }, v ? `${f.name} on for ${who}.` : `${f.name} off for ${who}. Nothing was deleted.`)}
            />
          </li>
        ))}
      </ul>
      {hid.length ? <p className="note">They hid {hid.map((id) => FEATURES.find((f) => f.id === id)!.name).join(", ")} on their own phone.</p> : null}
    </section>
  );
}

function PlayerDrawer({ p, onClose }: { p: DmPlayer; onClose: () => void }) {
  const { view, run, toast } = useDm();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSheet, setConfirmSheet] = useState(false);
  const [styling, setStyling] = useState(false);
  const link = absoluteHref(view.state.id, p.handle);
  return (
    <Drawer wide={!!p.sheet && !p.sheetOff} title={p.name} subtitle={`${formatCp(p.balanceCp)} · ${seenText(p.lastSeenAt)}`} onClose={onClose}>
      <div className="form">
        <Field label="Name" value={p.name} onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { name: v } })} />
        <Field label="Character name" value={p.character ?? ""} placeholder="Signs their Chronicle notes" onCommit={(v) => run({ type: "player.update", playerId: p.id, patch: { character: v } })} />
        <div className="pg-look-row">
          {p.look ? <PixelLook look={p.look} className="pg-look-big" alt={`${p.character || p.name}'s look`} /> : null}
          <div>
            <span className="label">Look</span>
            <p className="hint">{p.look ? "Their pixel-art character, on their token and the TV. Players usually make their own." : "No look yet. Players make one on their phone's Character tab, or you can make it for them."}</p>
            <button type="button" className="btn small" onClick={() => setStyling(true)}>
              {p.look ? "Change look" : "Make a look"}
            </button>
          </div>
        </div>
        {styling ? (
          <LookEditor
            initial={p.look}
            name={p.character || p.name}
            title={`${p.character || p.name}'s look`}
            onSave={async (look) => ((await run({ type: "player.look", playerId: p.id, look })) ? null : "Couldn't save the look.")}
            onRemove={p.look ? async () => ((await run({ type: "player.look", playerId: p.id, look: null })) ? null : "Couldn't remove it.") : undefined}
            onClose={() => setStyling(false)}
          />
        ) : null}
        <Field
          label="Level"
          value={p.level ? String(p.level) : ""}
          placeholder="Not set"
          hint="Changes it quietly. Use Level up for the moment on the TV."
          onCommit={(v) => {
            const n = Math.round(Number(v));
            if (v.trim() && (!Number.isFinite(n) || n < 1 || n > 20)) return false;
            return run({ type: "player.level", playerId: p.id, level: v.trim() ? n : null });
          }}
        />
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
      {roomsOn(view.state) ? (
        <section className="room-drawer" aria-label="Room">
          <h3>Room</h3>
          <RoomKey player={p} />
        </section>
      ) : null}
      <PlayerFeatures p={p} />
      {featureOn(view.state, "sheets") ? (
      <section className="dm-sheet" aria-label="Character sheet">
        <h3>Character sheet</h3>
        {p.sheetOff ? (
          <p className="note">Off: their phone shows the Gold tab as before{p.sheet ? ", and the sheet they made is kept for if you turn it back on" : ""}.</p>
        ) : p.sheet ? (
          <CharacterSheetView
            sheet={p.sheet}
            level={p.level}
            inspired={p.inspired}
            lockedOut={false}
            canLock
            onLock={(on) => void run({ type: "sheet.lock", playerId: p.id, on }, on ? `${p.name}'s class, scores and proficiencies are locked.` : `${p.name}'s sheet is unlocked.`)}
            onPatch={async (patch) => ((await run({ type: "sheet.update", playerId: p.id, patch })) ? null : "")}
            onAct={async (act) => ((await run({ type: "sheet.act", playerId: p.id, act })) ? null : "")}
            hp={p.hp && p.hp.max > 0 ? <p className="note">HP {p.hp.cur} of {p.hp.max}{p.hp.temp ? `, ${p.hp.temp} temp` : ""}. They change it on their phone, or you do in a fight.</p> : <p className="note">No HP set yet.</p>}
            editLabel="Edit"
          />
        ) : (
          <>
            <p className="note">{p.dndbUrl ? "They use D&D Beyond. " : ""}No sheet in the app yet. They can start one on their phone (Character tab), or you can start it here.</p>
            <div className="inline">
              <button className="btn small" type="button" onClick={() => run({ type: "sheet.update", playerId: p.id, patch: {} }, `Started a sheet for ${p.name}.`)}>
                Start a sheet
              </button>
            </div>
          </>
        )}
      </section>
      ) : null}
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
          {p.sheet ? (
            confirmSheet ? (
              <>
                <button className="btn small" type="button" onClick={() => setConfirmSheet(false)}>
                  Keep the sheet
                </button>
                <button className="btn small danger" type="button" onClick={async () => (await run({ type: "sheet.remove", playerId: p.id }, `Removed ${p.name}'s sheet.`)) && setConfirmSheet(false)}>
                  Remove the sheet for good
                </button>
              </>
            ) : (
              <button className="btn small" type="button" onClick={() => setConfirmSheet(true)}>
                Remove sheet
              </button>
            )
          ) : null}
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
