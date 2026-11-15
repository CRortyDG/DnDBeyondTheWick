"use client";

import { useState } from "react";
import { penName } from "@/shared/chronicle";
import { addDays, longDay, PARTY_COLORS, partiesOf, presentIds, tableParty, worldCalendar } from "@/shared/world";
import type { Party, WorldEvent } from "@/shared/types";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { Check } from "./Check";
import { PlusIcon } from "./navIcons";

/**
 * The shared world: parties, who's in each, which one is at the table, the
 * world's calendar and news for every party.
 */
export function WorldPanel() {
  const { view, run } = useDm();
  const s = view.state;
  const parties = partiesOf(s);
  const [name, setName] = useState("");
  const [first, setFirst] = useState("");
  const players = s.players.filter((p) => !p.archived);
  const seated = tableParty(s);
  const here = new Set(presentIds(s));
  const running = !!s.currentSessionId;

  if (!s.world) {
    return (
      <div className="world-panel pg">
        <PageHead title="Parties & world" sub="Run several parties in this campaign, on one calendar." />
        <section className="world-intro">
          <p>
            Make a second party when another group starts playing in {s.town?.trim() || "this world"}. Everyone at the table now becomes the first party. From then on, what a character learns stays with that character, in every party they play in.
          </p>
          <ul className="world-points">
            <li>The TV shows only what everyone at the table knows. Each phone shows what its own character knows.</li>
            <li>Each party keeps its own chapters, leads, votes and fog. The notice board, the shops and the calendar are shared.</li>
            <li>A character can play in several parties, and anyone can sit in as a guest for one session.</li>
          </ul>
          <form
            className="world-make"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run({ type: "party.add", name: name.trim() || "The second party", firstName: first.trim() || undefined }, "This campaign is now a shared world.")) {
                setName("");
                setFirst("");
              }
            }}
          >
            <label>
              Name the party playing now
              <input className="fld" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="The first party" maxLength={40} />
            </label>
            <label>
              Name the new party
              <input className="fld" value={name} onChange={(e) => setName(e.target.value)} placeholder="The second party" maxLength={40} />
            </label>
            <button className="btn primary" type="submit">
              <PlusIcon size={16} /> Make a second party
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="world-panel pg">
      <PageHead
        title="Parties & world"
        sub={seated ? `${seated.name} is at the table.` : "No party is at the table."}
        help={
          <>
            <p>Seat a party before its session: its members are at the table and everyone else is away. Tick someone from another party under Players (or in run-game) to have them sit in as a guest.</p>
            <p>A new member catches up on what everyone already in the party knows. What a character learns in any party stays theirs. The TV shows only what everyone at the table knows; to share something one character knows, use Tell the table on the entry in Discovery.</p>
          </>
        }
        stats={[
          { label: "Parties", value: parties.length },
          { label: "At the table", value: here.size },
          ...(s.world.date ? [{ label: "World date", value: longDay(s.world.date), tone: "gold" as const }] : []),
        ]}
      />

      <section className="world-section">
        <h3 className="pg-section">Parties</h3>
        <div className="party-grid">
          {parties.map((p) => (
            <PartyCard key={p.id} party={p} seated={p.id === s.partyId} running={running} canRemove={parties.length > 1 && p.id !== s.partyId} />
          ))}
        </div>
        <form
          className="pg-inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run({ type: "party.add", name: name.trim() }, `Made ${name.trim() || "a new party"}.`)) setName("");
          }}
        >
          <input className="fld" value={name} onChange={(e) => setName(e.target.value)} placeholder="New party's name" aria-label="New party's name" maxLength={40} />
          <button className="btn" type="submit">
            <PlusIcon size={16} /> Add a party
          </button>
        </form>
      </section>

      <section className="world-section">
        <h3 className="pg-section">Who plays where</h3>
        <div className="world-table-wrap">
          <table className="world-members">
            <thead>
              <tr>
                <th scope="col">Character</th>
                {parties.map((p) => (
                  <th key={p.id} scope="col">
                    <span className="party-dot" style={{ background: p.color }} aria-hidden="true" /> {p.name}
                  </th>
                ))}
                <th scope="col">Tonight</th>
              </tr>
            </thead>
            <tbody>
              {players.map((pl) => (
                <tr key={pl.id}>
                  <th scope="row">
                    {penName(pl)}
                    {pl.character?.trim() && pl.character.trim() !== pl.name ? <span className="note"> {pl.name}</span> : null}
                  </th>
                  {parties.map((p) => (
                    <td key={p.id}>
                      <Check checked={p.memberIds.includes(pl.id)} onChange={(v) => run({ type: "party.member", partyId: p.id, playerId: pl.id, member: v }, v ? `${penName(pl)} joined ${p.name}.` : `${penName(pl)} left ${p.name}.`)}>
                        <span className="sr-only">
                          {penName(pl)} in {p.name}
                        </span>
                      </Check>
                    </td>
                  ))}
                  <td>
                    <Check checked={here.has(pl.id)} onChange={(v) => run({ type: "player.update", playerId: pl.id, patch: { away: !v } })}>
                      {here.has(pl.id) ? (seated && !seated.memberIds.includes(pl.id) ? "Guest" : "Here") : "Away"}
                    </Check>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Joining a party catches the character up on what everyone already in it knows.</p>
      </section>

      <WorldClock />
      <WorldNews />
    </div>
  );
}

function PartyCard({ party, seated, running, canRemove }: { party: Party; seated: boolean; running: boolean; canRemove: boolean }) {
  const { view, run } = useDm();
  const s = view.state;
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const chapters = s.sessions.filter((x) => x.partyId === party.id).length;
  const members = party.memberIds.map((id) => s.players.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p && !p.archived);
  return (
    <article className={`party-card${seated ? " seated" : ""}`} style={{ borderColor: party.color }}>
      <header>
        <span className="party-dot big" style={{ background: party.color }} aria-hidden="true" />
        {nameDraft !== null ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run({ type: "party.update", partyId: party.id, patch: { name: nameDraft } })) setNameDraft(null);
            }}
          >
            <input className="fld" autoFocus value={nameDraft} maxLength={40} onChange={(e) => setNameDraft(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setNameDraft(null)} aria-label="Party name" />
          </form>
        ) : (
          <button type="button" className="party-name" onClick={() => setNameDraft(party.name)} title="Rename">
            {party.name}
          </button>
        )}
        {seated ? <span className="tag live">At the table</span> : null}
      </header>
      <p className="party-members">{members.length ? members.map(penName).join(", ") : "Nobody yet. Tick characters below."}</p>
      <p className="note">
        {chapters === 0 ? "No chapters yet" : chapters === 1 ? "1 chapter played" : `${chapters} chapters played`}
      </p>
      <div className="party-colors" role="group" aria-label={`${party.name}'s colour`}>
        {PARTY_COLORS.map((c) => (
          <button key={c} type="button" className={`swatch${c === party.color ? " on" : ""}`} style={{ background: c }} aria-label={`Colour ${c}`} aria-pressed={c === party.color} onClick={() => run({ type: "party.update", partyId: party.id, patch: { color: c } })} />
        ))}
      </div>
      <div className="party-actions">
        {seated ? null : (
          <button className="btn primary small" type="button" disabled={running} title={running ? "End the session first" : undefined} onClick={() => run({ type: "party.play", partyId: party.id }, `${party.name} is at the table.`)}>
            Seat at the table
          </button>
        )}
        {canRemove ? (
          <button className="btn ghost small" type="button" onClick={() => confirm(`Delete ${party.name}? Its chapters stay in the Chronicle; its leads go.`) && run({ type: "party.remove", partyId: party.id }, `Deleted ${party.name}.`)}>
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}

function WorldClock() {
  const { view, run } = useDm();
  const w = view.state.world!;
  const cal = worldCalendar(view.state);
  const events = [...(w.events ?? [])].sort((a, b) => a.from.localeCompare(b.from));
  const [adding, setAdding] = useState(false);
  const setDate = (date: string | null) => run({ type: "world.date", date }, date ? `It's ${longDay(date)} in the world.` : "The world clock is off.");
  return (
    <section className="world-section">
      <h3 className="pg-section">The world&rsquo;s calendar</h3>
      <div className="world-clock">
        <label>
          Today in the world
          <input className="fld" type="date" value={w.date ?? ""} onChange={(e) => setDate(e.target.value || null)} />
        </label>
        {w.date ? (
          <div className="seg" role="group" aria-label="Move the date on">
            <button className="btn small" type="button" onClick={() => setDate(addDays(w.date!, 1))}>
              +1 day
            </button>
            <button className="btn small" type="button" onClick={() => setDate(addDays(w.date!, 7))}>
              +1 week
            </button>
          </div>
        ) : (
          <span className="note">Set a date to show it, and what&rsquo;s coming, on the TV and every phone.</span>
        )}
        {cal.now.length ? <span className="tag live">Now: {cal.now.map((e) => e.name).join(", ")}</span> : null}
        {cal.next ? <span className="tag">{cal.next.inDays === 1 ? `${cal.next.name} tomorrow` : `${cal.next.name} in ${cal.next.inDays} days`}</span> : null}
      </div>
      <p className="note">Moving the date past an event&rsquo;s first day announces it to every party, on the TV and in each Chronicle.</p>
      <ol className="scene-list world-events">
        {events.map((ev) => (
          <EventRow key={ev.id} ev={ev} />
        ))}
        {!events.length && !adding ? <li className="pg-empty">No events yet. Add festivals and big days everyone lives through, like Winterfest.</li> : null}
      </ol>
      {adding ? (
        <EventForm
          onDone={() => setAdding(false)}
          initial={{ name: "", from: w.date ?? "", to: w.date ?? "", note: "" }}
          submit={(ev) => run({ type: "world.eventAdd", event: ev }, `Added ${ev.name}.`)}
        />
      ) : (
        <button className="btn" type="button" onClick={() => setAdding(true)}>
          <PlusIcon size={16} /> Add an event
        </button>
      )}
    </section>
  );
}

function EventRow({ ev }: { ev: WorldEvent }) {
  const { run } = useDm();
  const [editing, setEditing] = useState(false);
  if (editing) return <li className="scene-item list-row"><EventForm initial={ev} onDone={() => setEditing(false)} submit={(patch) => run({ type: "world.eventUpdate", eventId: ev.id, patch })} /></li>;
  return (
    <li className="scene-item list-row">
      <div className="scene-row">
        <button type="button" className="row-main" onClick={() => setEditing(true)} title={`Edit ${ev.name}`}>
          <span className="row-title">{ev.name}</span>
          <span className="row-sub">
            {ev.from === ev.to ? longDay(ev.from) : `${longDay(ev.from)} to ${longDay(ev.to)}`}
            {ev.note ? ` · ${ev.note}` : ""}
          </span>
        </button>
        <button className="btn ghost small" type="button" onClick={() => confirm(`Take ${ev.name} off the calendar?`) && run({ type: "world.eventRemove", eventId: ev.id })}>
          Remove
        </button>
      </div>
    </li>
  );
}

function EventForm({ initial, submit, onDone }: { initial: Omit<WorldEvent, "id">; submit: (ev: Omit<WorldEvent, "id">) => Promise<boolean>; onDone: () => void }) {
  const [ev, setEv] = useState({ name: initial.name, from: initial.from, to: initial.to, note: initial.note });
  return (
    <form
      className="world-event-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await submit({ ...ev, to: ev.to || ev.from })) onDone();
      }}
    >
      <label>
        Event
        <input className="fld" autoFocus value={ev.name} maxLength={60} onChange={(e) => setEv({ ...ev, name: e.target.value })} placeholder="Winterfest" />
      </label>
      <label>
        From
        <input className="fld" type="date" required value={ev.from} onChange={(e) => setEv({ ...ev, from: e.target.value, to: ev.to && ev.to >= e.target.value ? ev.to : e.target.value })} />
      </label>
      <label>
        To
        <input className="fld" type="date" required value={ev.to} min={ev.from} onChange={(e) => setEv({ ...ev, to: e.target.value })} />
      </label>
      <label className="wide">
        One line players read
        <input className="fld" value={ev.note} maxLength={200} onChange={(e) => setEv({ ...ev, note: e.target.value })} placeholder="The whole town hangs candles in every window." />
      </label>
      <div className="world-event-actions">
        <button className="btn primary" type="submit">
          Save
        </button>
        <button className="btn ghost" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function WorldNews() {
  const { view, run } = useDm();
  const [text, setText] = useState("");
  const [tv, setTv] = useState(true);
  const news = (view.state.notes ?? []).filter((n) => n.world).slice(-5).reverse();
  return (
    <section className="world-section">
      <h3 className="pg-section">World news</h3>
      <p className="note">One line for every party: it goes in each party&rsquo;s Chronicle, and on the TV. The details of what happened stay with whoever was there.</p>
      <form
        className="pg-inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run({ type: "world.news", text, tv }, "Posted to every party.")) setText("");
        }}
      >
        <input className="fld" value={text} maxLength={200} onChange={(e) => setText(e.target.value)} placeholder="The old well in Candlefair has been cleared." aria-label="World news" />
        <label className="check">
          <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} /> On the TV
        </label>
        <button className="btn primary" type="submit" disabled={!text.trim()}>
          Post
        </button>
      </form>
      {news.length ? (
        <ul className="world-news-list">
          {news.map((n) => (
            <li key={n.id}>
              <span className="note">{new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span> {n.text}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
