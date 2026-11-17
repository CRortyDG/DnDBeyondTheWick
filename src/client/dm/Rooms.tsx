"use client";

// Rooms at the inn, DM side: the room fields on a place, the key rack picker
// (check-in), the rent settings and register, and the session-start reminders.

import { useState } from "react";
import type { Entry, GameState, Player, RoomInfo, Session } from "@/shared/types";
import { cpToGpInput, formatCp, parseAmount } from "@/shared/money";
import { ranksOf, rankName } from "@/shared/renown";
import { featureOn } from "@/shared/features";
import { rollTable, tablesOf } from "@/shared/tables";
import { bedsOf, behindOnRent, goodRoomLock, HOOKS, registerOf, rentFor, ROOM_TYPES, roomRentalOf, roomSettings, roomsOf, startPerks, suggestMoment, tenancies, type RoomEntry } from "@/shared/rooms";
import { useDm } from "./context";
import { Field } from "./Field";
import { Check } from "./Check";
import { InspireToggle } from "./InspireToggle";

const who = (p: Pick<Player, "name" | "character"> | undefined) => (p ? p.character?.trim() || p.name : "someone");

export function roomsOn(s: GameState): boolean {
  return featureOn(s, "rooms") && roomsOf(s).length > 0;
}

// ---------------------------------------------------------------------------
// The room block on a place (Discover editor)

type RoomPatch = { hook: number; type: RoomInfo["type"]; key: string; keyMissing?: boolean; perk: string; tag?: string; rentCp?: number | null; beds?: number | null; startPerk?: "inspiration" | "rumor" | null };

export function RoomFields({ entry: e }: { entry: Entry }) {
  const { view, run } = useDm();
  const s = view.state;
  const rooms = roomsOf(s);
  const r = e.room;
  const save = (p: Partial<RoomPatch>) => {
    if (!r) return;
    const cur: RoomPatch = { hook: r.hook, type: r.type, key: r.key, perk: r.perk, ...(r.keyMissing ? { keyMissing: true } : {}), ...(r.tag ? { tag: r.tag } : {}), rentCp: r.rentCp ?? null, beds: r.beds ?? null, startPerk: r.startPerk ?? null };
    return run({ type: "entry.update", entryId: e.id, patch: { room: { ...cur, ...p } } });
  };
  if (!r) {
    const free = Array.from({ length: HOOKS }, (_, i) => i + 1).find((h) => !rooms.some((x) => x.room.hook === h));
    return (
      <div className="inline room-make">
        <button className="btn small" type="button" disabled={!free} title={free ? "Give it a hook on the key rack" : "All 12 hooks are taken."} onClick={() => free && run({ type: "entry.update", entryId: e.id, patch: { room: { hook: free, type: "guest", key: "", perk: "" } } })}>
          Make this a room at an inn
        </button>
        <span className="note">A room gets a hook on the key rack, a key and a perk. Its inn is its first area.</span>
      </div>
    );
  }
  const tenants = tenancies(s, e.id);
  return (
    <section className="room-fields" aria-label="Room">
      <h4>Room at {e.areas[0] || "the inn"}</h4>
      <div className="inline">
        <label>
          Hook
          <select className="fld" value={r.hook} onChange={(ev) => void save({ hook: Number(ev.target.value) })}>
            {Array.from({ length: HOOKS }, (_, i) => i + 1).map((h) => {
              const other = rooms.find((x) => x.room.hook === h && x.id !== e.id);
              return (
                <option key={h} value={h} disabled={!!other}>
                  {h}
                  {other ? ` (${other.name})` : ""}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          Type
          <select className="fld" value={r.type} onChange={(ev) => void save({ type: ev.target.value as RoomInfo["type"] })} disabled={tenants.length > 0 && r.type !== "staff"}>
            {ROOM_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Key (players see it)" value={r.key} placeholder="the seahorse key" onCommit={(v) => save({ key: v })} />
        <Check checked={!!r.keyMissing} onChange={(v) => save({ keyMissing: v || undefined })}>
          Key is missing
        </Check>
      </div>
      {r.type !== "staff" ? (
        <>
          <div className="inline">
            <Field label="Perk (players see it)" value={r.perk} multiline placeholder="Warmest bed in the inn. You never wake up cold." onCommit={(v) => save({ perk: v })} />
            <Field label="Tag line (the paper tag)" value={r.tag ?? ""} placeholder="Bucket provided." onCommit={(v) => save({ tag: v || undefined })} />
          </div>
          <div className="inline">
            <Field
              label="Rent a month (empty: the inn's)"
              value={r.rentCp != null ? cpToGpInput(r.rentCp) : ""}
              placeholder={`${cpToGpInput(rentFor(s, { ...r, rentCp: undefined }))} gp`}
              onCommit={(v) => {
                if (!v.trim()) return save({ rentCp: null });
                const cp = parseAmount(v);
                return cp === null ? false : save({ rentCp: cp });
              }}
            />
            <label>
              Beds
              <select className="fld" value={r.beds ?? 2} onChange={(ev) => void save({ beds: Number(ev.target.value) === 2 ? null : Number(ev.target.value) })}>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              At each session start
              <select className="fld" value={r.startPerk ?? (r.type === "good" ? "inspiration" : "")} onChange={(ev) => void save({ startPerk: (ev.target.value || null) as RoomPatch["startPerk"] })}>
                <option value="">Nothing</option>
                <option value="inspiration">Remind me: Inspiration</option>
                <option value="rumor">Remind me: a free rumor</option>
              </select>
            </label>
          </div>
        </>
      ) : null}
      <p className="note">
        The story hook is this place&rsquo;s <b>Secrets</b>, and the innkeeper&rsquo;s line when someone takes the key is its <b>DM notes</b>. Players never see either.
        {tenants.length ? ` Lives here: ${tenants.map((t) => who(s.players.find((p) => p.id === t.playerId))).join(", ")}.` : ""}
      </p>
      <button className="btn small ghost" type="button" disabled={tenants.length > 0} title={tenants.length ? "Check them out first." : undefined} onClick={() => run({ type: "entry.update", entryId: e.id, patch: { room: null } })}>
        Not a room
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Check-in: the key rack picker

/** Why this character can't take this room now, or null. */
function blocked(s: GameState, p: Player, room: RoomEntry): string | null {
  if (room.room.type === "staff") return "Staff only";
  if (room.room.keyMissing) return "Key missing";
  if (roomRentalOf(s, p.id)?.roomId === room.id) return "Theirs";
  if (tenancies(s, room.id).length >= bedsOf(room.room)) return "Full";
  if (room.room.type === "good" && goodRoomLock(s, p.id)) return `Needs ${rankName(roomSettings(s).good.rank, s)}`;
  return null;
}

/** A character's room, with a button that opens the rack to give or change their key. */
export function RoomKey({ player: p, compact }: { player: Player; compact?: boolean }) {
  const { view, run } = useDm();
  const s = view.state;
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState<{ room: string; line: string } | null>(null);
  if (!roomsOn(s)) return null;
  const r = roomRentalOf(s, p.id);
  const mine = r && roomsOf(s).find((x) => x.id === r.roomId);
  const pick = async (room: RoomEntry) => {
    if (await run({ type: "room.assign", playerId: p.id, roomId: room.id }, r ? `${who(p)} moved to ${room.name}.` : `${who(p)} has ${room.name}.`)) {
      setOpen(false);
      setSaid(room.dmNote.trim() ? { room: room.name, line: room.dmNote.trim() } : null);
    }
  };
  return (
    <div className={`room-key${compact ? " compact" : ""}`}>
      <button type="button" className={`btn small room-key-btn${mine ? " on" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} title={mine ? `${mine.name}: ${mine.room.key}. Tap to move.` : `Give ${who(p)} a key`}>
        <span aria-hidden="true">🔑</span> {mine ? `${mine.room.hook} · ${mine.name}` : compact ? "Key" : "Give a key"}
      </button>
      {open ? (
        <div className="key-picker" role="group" aria-label={`Key rack for ${who(p)}`}>
          <ol className="key-picker-hooks">
            {Array.from({ length: HOOKS }, (_, i) => i + 1).map((h) => {
              const room = roomsOf(s).find((x) => x.room.hook === h);
              if (!room) return <li key={h} className="key-hook empty"><span className="key-hook-n">{h}</span></li>;
              const why = blocked(s, p, room);
              const taken = tenancies(s, room.id).map((t) => who(s.players.find((x) => x.id === t.playerId)));
              return (
                <li key={h} className={`key-hook ${room.room.type}${why ? " blocked" : ""}`}>
                  <button type="button" disabled={!!why} onClick={() => void pick(room)} title={why ?? `${room.room.perk}${taken.length ? ` · with ${taken.join(", ")}` : ""}`}>
                    <span className="key-hook-n">{h}</span>
                    <span className="key-hook-name">{room.name}</span>
                    <span className="key-hook-sub">
                      {why ?? (room.room.type === "staff" ? "" : `${taken.length ? taken.join(", ") : "Free"} · ${formatCp(rentFor(s, room.room))}`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="inline">
            {r ? (
              <button className="btn small ghost" type="button" onClick={async () => (await run({ type: "room.assign", playerId: p.id, roomId: null }, `${who(p)} checked out.`)) && setOpen(false)}>
                Check out
              </button>
            ) : (
              <span className="note">{roomSettings(s).firstFree && !s.rentals.some((x) => x.roomId && x.playerId === p.id) ? "Their first month is free." : "The first month is paid now if they can."}</span>
            )}
          </div>
        </div>
      ) : null}
      {said ? (
        <p className="room-said" role="status">
          <b>Read aloud ({said.room}):</b> {said.line}{" "}
          <button className="btn small ghost" type="button" onClick={() => setSaid(null)}>
            OK
          </button>
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings and the register (Players page)

export function RoomsBox() {
  const { view, run } = useDm();
  const s = view.state;
  if (!roomsOn(s)) return null;
  const set = roomSettings(s);
  const rooms = roomsOf(s);
  const inn = rooms[0]?.areas[0] || "The inn";
  const register = registerOf(s);
  const behind = behindOnRent(s);
  const ranks = ranksOf(s);
  const money = (v: string) => parseAmount(v);
  return (
    <section className="box rooms-box" aria-label="Rooms">
      <h3>Rooms at {inn}</h3>
      <ol className="rooms-rack">
        {rooms.map((room) => {
          const ten = tenancies(s, room.id);
          return (
            <li key={room.id} className={`rooms-rack-row ${room.room.type}`}>
              <span className="key-hook-n">{room.room.hook}</span>
              <span className="grow">
                <b>{room.name}</b>
                <span className="note"> {room.room.type === "staff" ? "Staff" : ten.length ? ten.map((t) => who(s.players.find((p) => p.id === t.playerId))).join(", ") : "Free"}</span>
              </span>
              <span className="note">{room.room.keyMissing ? "Key missing" : room.room.type === "staff" ? "" : formatCp(rentFor(s, room.room))}</span>
            </li>
          );
        })}
      </ol>
      {behind.length ? (
        <div className="rooms-behind">
          <h4>Rent missed</h4>
          {behind.map((r) => (
            <div key={r.id} className="inline">
              <span className="grow">
                {who(s.players.find((p) => p.id === r.playerId))}: {r.itemName}, paid through session {r.paidThrough}
              </span>
              <button className="btn small" type="button" onClick={() => run({ type: "room.waive", rentalId: r.id }, "Waived.")}>
                Waive it
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <h4>Rent</h4>
      <div className="inline">
        <Field label="Rent a month (one session)" value={cpToGpInput(set.rentCp)} hint="gp" onCommit={(v) => { const cp = money(v); return cp === null ? false : run({ type: "rooms.settings", patch: { rentCp: cp } }); }} />
        <Check checked={set.firstFree} onChange={(v) => run({ type: "rooms.settings", patch: { firstFree: v } })}>
          First month free (a welcome)
        </Check>
      </div>
      <h4>The Good Room</h4>
      <div className="inline">
        <div className="seg" role="group" aria-label="How the Good Room is earned">
          <button type="button" className={`btn small${set.good.mode === "renown" ? " on" : ""}`} aria-pressed={set.good.mode === "renown"} onClick={() => run({ type: "rooms.settings", patch: { good: { mode: "renown" } } })}>
            Earned with Renown
          </button>
          <button type="button" className={`btn small${set.good.mode === "rent" ? " on" : ""}`} aria-pressed={set.good.mode === "rent"} onClick={() => run({ type: "rooms.settings", patch: { good: { mode: "rent" } } })}>
            Higher rent
          </button>
        </div>
        {set.good.mode === "renown" ? (
          <label>
            Needs
            <select className="fld" value={set.good.rank} onChange={(e) => run({ type: "rooms.settings", patch: { good: { rank: Number(e.target.value) } } })}>
              {ranks.map((rk, i) => (
                <option key={i} value={i}>
                  {rk.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Field label="Rent a month" value={cpToGpInput(set.good.rentCp)} hint="gp" onCommit={(v) => { const cp = money(v); return cp === null ? false : run({ type: "rooms.settings", patch: { good: { rentCp: cp } } }); }} />
        )}
      </div>
      <p className="note">{set.good.mode === "renown" ? `Locked until a character reaches ${rankName(set.good.rank, s)}${s.world ? " (their own Renown)" : ""}, then the normal rent.` : "Anyone who'll pay can have it."} Moving in frees their old bed.</p>
      <h4>The register</h4>
      <p className="note">Every check-in, newest first. Only you see it.</p>
      <ol className="rooms-register">
        {register.slice(0, 30).map((x, i) => (
          <li key={i}>
            {new Date(x.at).toLocaleDateString()} · <b>{x.who}</b> · {x.room}
            {x.active ? "" : x.endedAt ? ` (left ${new Date(x.endedAt).toLocaleDateString()})` : " (left)"}
          </li>
        ))}
        {set.register.map((line, i) => (
          <li key={`old${i}`} className="old">
            {line}
          </li>
        ))}
        {!register.length && !set.register.length ? <li className="note">Nobody has checked in yet.</li> : null}
      </ol>
      <Field
        label="Older register lines (one per line, written in by hand)"
        multiline
        value={set.register.join("\n")}
        placeholder="Last Nightal · a guest who left no name, only a broken-ring mark · The Good Room"
        onCommit={(v) => run({ type: "rooms.settings", patch: { register: v.split("\n") } })}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Session start: because of your room

export function RoomStart({ session }: { session: Session }) {
  const { view, run, toast } = useDm();
  const s = view.state;
  const [skip, setSkip] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [rumor, setRumor] = useState<Record<string, string>>({});
  if (!roomsOn(s)) return null;
  const behind = behindOnRent(s).filter((r) => {
    const p = s.players.find((x) => x.id === r.playerId);
    return p && !p.archived;
  });
  const perks = startPerks(s);
  const doneThisSession = new Set((s.roomMoments ?? []).filter((m) => m.sessionId === session.id).map((m) => m.playerId));
  const sug = doneThisSession.size ? null : suggestMoment(s, skip);
  const rumorTables = tablesOf(s).filter((t) => t.kind === "rumor");
  // The cheapest guest room with a free bed: where Mags puts your things.
  const cheapest = (playerId: string) =>
    roomsOf(s)
      .filter((x) => x.room.type === "guest" && !x.room.keyMissing && tenancies(s, x.id).length < bedsOf(x.room) && roomRentalOf(s, playerId)?.roomId !== x.id)
      .sort((a, b) => rentFor(s, a.room) - rentFor(s, b.room))[0];
  if (!behind.length && !perks.length && !sug && !doneThisSession.size) return null;
  return (
    <section className="run-section room-start">
      <h2>Because of your room</h2>
      {behind.map((r) => {
        const p = s.players.find((x) => x.id === r.playerId)!;
        const to = cheapest(p.id);
        return (
          <div key={r.id} className="room-flag">
            <p>
              <b>{who(p)}</b> missed the rent on {r.itemName} (paid through session {r.paidThrough}).{to ? <> Mags&rsquo;s move: &ldquo;Your things are in {to.name} now.&rdquo;</> : null}
            </p>
            <div className="inline">
              {to ? (
                <button className="btn small" type="button" onClick={() => run({ type: "room.assign", playerId: p.id, roomId: to.id }, `${who(p)} moved to ${to.name}.`)}>
                  Move them to {to.name}
                </button>
              ) : null}
              <button className="btn small" type="button" onClick={() => run({ type: "room.waive", rentalId: r.id }, "Waived.")}>
                Waive it
              </button>
            </div>
          </div>
        );
      })}
      {perks.map((x) => (
        <div key={`${x.kind}-${x.player.id}`} className="room-perk inline">
          {x.kind === "inspiration" ? (
            <>
              <span className="grow">
                <b>{who(x.player)}</b> is in {x.room.name}: hand them a Candle&rsquo;s Luck token (Heroic Inspiration).
              </span>
              <InspireToggle playerId={x.player.id} name={x.player.name} on={!!x.player.inspired} />
            </>
          ) : (
            <>
              <span className="grow">
                <b>{who(x.player)}</b> is {x.room.name}: one free rumor, up through the floorboards.
                {rumor[x.player.id] ? <span className="room-rumor"> &ldquo;{rumor[x.player.id]}&rdquo;</span> : null}
              </span>
              {rumorTables.length ? (
                <button
                  className="btn small"
                  type="button"
                  onClick={() => {
                    const t = rumorTables[Math.floor(Math.random() * rumorTables.length)];
                    const r = rollTable(t);
                    if (r.row) setRumor((m) => ({ ...m, [x.player.id]: r.row!.text }));
                    else toast(`Nothing on ${r.roll} in ${t.name}.`);
                  }}
                >
                  Roll a rumor
                </button>
              ) : null}
            </>
          )}
        </div>
      ))}
      {sug ? (
        <div className="room-moment">
          <p>
            A room moment for <b>{who(sug.player)}</b> in <b>{sug.room.name}</b>:
          </p>
          <ul className="run-notelist">
            {sug.room.room.perk ? <li>Perk: {sug.room.room.perk}</li> : null}
            {sug.room.secrets ? <li className="dm-only">Story hook (only you): {sug.room.secrets}</li> : null}
          </ul>
          <div className="inline">
            <input className="fld grow" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="What happened (optional)" aria-label="What happened" />
            <button
              className="btn small primary"
              type="button"
              onClick={async () => {
                if (await run({ type: "room.moment", playerId: sug.player.id, ...(note.trim() ? { note } : {}) }, "Logged.")) setNote("");
              }}
            >
              Done
            </button>
            <button className="btn small ghost" type="button" onClick={() => setSkip((k) => [...k, sug.player.id])}>
              Someone else
            </button>
          </div>
        </div>
      ) : doneThisSession.size ? (
        <p className="note">Room moment done this session: {[...doneThisSession].map((id) => who(s.players.find((p) => p.id === id))).join(", ")}.</p>
      ) : null}
    </section>
  );
}
