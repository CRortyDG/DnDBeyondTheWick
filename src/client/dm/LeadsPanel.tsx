"use client";

// The DM's Leads tab: threads the party can pull on, each about an entry,
// pointing at a place and maybe tied to a job flyer. Open -> Followed ->
// Closed. A vote lets the table pick between two or three; it closes when you
// press Close or when its time runs out, and you break any tie.

import { useEffect, useState } from "react";
import { entriesOf, kindInfo } from "@/shared/discovery";
import { leadsOf, leadVisible, tally, voteClosed } from "@/shared/leads";
import type { Lead, LeadStatus } from "@/shared/types";
import { penName } from "@/shared/chronicle";
import { DownIcon, TvIcon, UpIcon } from "../ui/icons";
import { PageHead } from "./PageHead";
import { PlusIcon } from "./navIcons";
import { Field } from "./Field";
import { useDm } from "./context";

const STATUSES: { id: LeadStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "followed", label: "Followed" },
  { id: "closed", label: "Closed" },
];

function useNow(every = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

export function LeadsPanel() {
  const { view, run } = useDm();
  const s = view.state;
  const leads = leadsOf(s);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [minutes, setMinutes] = useState("");
  const [adding, setAdding] = useState(false);
  const now = useNow();
  const v = s.vote;
  const voteOpen = !!v && !voteClosed(v, now);
  const name = (id?: string) => (id ? leads.find((l) => l.id === id)?.text ?? "?" : "?");

  const count = (st: LeadStatus) => leads.filter((l) => l.status === st).length;
  const shown = leads.filter((l) => l.shown).length;

  return (
    <div className="people-panel leads-panel pg">
      <PageHead
        title="Leads"
        sub="Threads the party can pull on, and votes on where to go next."
        help={
          <p>
            Players see a lead once you show it and whatever it&rsquo;s about isn&rsquo;t hidden. Leads are grouped by the place they point to. Your notes never leave this screen. To let the table choose, tick two or three shown leads and open a vote; everyone sees the count as it comes in.
          </p>
        }
        actions={
          <>
            <button className={`btn${s.live.leads ? " on" : ""}`} type="button" aria-pressed={!!s.live.leads} onClick={() => void run({ type: "live.leads", on: !s.live.leads })}>
              <TvIcon /> {s.live.leads ? "Leads board is on the TV" : "Leads board on the TV"}
            </button>
            <button className="btn primary" type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
              <PlusIcon size={16} /> Lead
            </button>
          </>
        }
        stats={[
          { label: "Open", value: count("open"), tone: "gold" },
          { label: "Followed", value: count("followed"), tone: "ok" },
          { label: "Closed", value: count("closed"), tone: "muted" },
          { label: "Shown to players", value: shown, tone: "muted" },
        ]}
      />

      {adding ? (
        <form
          className="pg-inline-form wide"
          onSubmit={async (ev) => {
            ev.preventDefault();
            if (!text.trim()) return;
            const ok = await run({ type: "lead.add", text, shown: false }, "Added as a draft. Tick Shown when the party learns of it.");
            if (ok) {
              setText("");
              setAdding(false);
            }
          }}
        >
          <input className="fld" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Who’s buying up all the lantern oil?" aria-label="New lead" onKeyDown={(e) => e.key === "Escape" && setAdding(false)} />
          <button className="btn primary" type="submit" disabled={!text.trim()}>
            Add as draft
          </button>
          <button className="btn ghost" type="button" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : null}

      {v ? (
        <section className="box pg-card vote-card">
          <h3>The vote</h3>
          <VoteBox now={now} />
          {!voteOpen && v.winnerId ? <p className="note">Chosen: {name(v.winnerId)}. The TV shows it at the start of the next session.</p> : null}
        </section>
      ) : (
        <div className={`pg-toolbar vote-bar${picked.length ? " active" : ""}`}>
          <span className="note">{picked.length ? `${picked.length} picked for a vote.` : "Tick two or three shown leads to put them to a vote."}</span>
          <span className="grow" />
          {picked.length ? (
            <>
              <label className="pg-toolbar-field">
                Closes in
                <input className="fld amt" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} placeholder="no limit" aria-label="Closes in minutes" />
                min
              </label>
              <button className="btn small ghost" type="button" onClick={() => setPicked([])}>
                Clear
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={picked.length < 2 || picked.length > 3}
                onClick={async () => {
                  const ok = await run({ type: "vote.open", leadIds: picked, ...(Number(minutes) ? { minutes: Number(minutes) } : {}) }, "The vote is open.");
                  if (ok) setPicked([]);
                }}
              >
                Open the vote
              </button>
            </>
          ) : null}
        </div>
      )}

      <ol className="scene-list people-list">
        {leads.map((l, i) => (
          <LeadRow
            key={l.id}
            lead={l}
            first={i === 0}
            last={i === leads.length - 1}
            pickable={!v}
            picked={picked.includes(l.id)}
            onPick={(on) => setPicked(on ? [...picked, l.id].slice(-3) : picked.filter((x) => x !== l.id))}
          />
        ))}
      </ol>

      {leads.length === 0 ? <p className="pg-empty">No leads yet. Add one when the party hears a rumor worth chasing.</p> : null}
    </div>
  );
}

function VoteBox({ now }: { now: number }) {
  const { view, run } = useDm();
  const s = view.state;
  const v = s.vote!;
  const closed = voteClosed(v, now);
  const t = tally(v);
  const players = new Map(s.players.map((p) => [p.id, penName(p)]));
  const winner = v.winnerId ?? (closed ? t.winnerId : undefined);
  const tied = closed && !winner ? (v.tied ?? t.tied ?? []) : [];
  const left = v.closesAt && !closed ? Math.max(0, Math.ceil((v.closesAt - now) / 60_000)) : 0;
  return (
    <div className="vote-box">
      <ul className="vote-options">
        {v.leadIds.map((id) => {
          const l = leadsOf(s).find((x) => x.id === id);
          const who = Object.entries(v.ballots)
            .filter(([, x]) => x === id)
            .map(([pid]) => players.get(pid) ?? "Someone");
          return (
            <li key={id} className={winner === id ? "won" : ""}>
              <strong>{t.counts[id]}</strong> {l?.text ?? "(removed)"}
              {who.length ? <span className="note"> · {who.join(", ")}</span> : null}
              {closed && (tied.includes(id) || winner !== id) ? (
                <button type="button" className="btn small" onClick={() => void run({ type: "vote.pick", leadId: id }, "Picked.")}>
                  {tied.includes(id) ? "Break the tie" : "Pick this instead"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="inline">
        {closed ? (
          <span className="note">{winner ? "Closed." : "Closed on a tie. Pick one."}</span>
        ) : (
          <>
            <span className="note">{left ? `Open, closes in about ${left} min.` : "Open."}</span>
            <button type="button" className="btn" onClick={() => void run({ type: "vote.close" }, "The vote is closed.")}>
              Close now
            </button>
          </>
        )}
        <button type="button" className="btn small" onClick={() => void run({ type: "vote.clear" })}>
          Clear the vote
        </button>
      </div>
    </div>
  );
}

function LeadRow({ lead: l, first, last, pickable, picked, onPick }: { lead: Lead; first: boolean; last: boolean; pickable: boolean; picked: boolean; onPick: (on: boolean) => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const all = entriesOf(s);
  const places = all.filter((e) => e.kind === "place");
  const patch = (p: { text?: string; entryId?: string | null; placeId?: string | null; jobId?: string | null; shown?: boolean; dmNote?: string }) => run({ type: "lead.update", leadId: l.id, patch: p });
  const visible = leadVisible(s, l);
  const about = l.entryId ? all.find((e) => e.id === l.entryId) : undefined;
  return (
    <li className={`scene-item lead-item lead-${l.status}`}>
      <div className="inline">
        {pickable ? <input type="checkbox" aria-label="Put in the vote" checked={picked} disabled={!visible || l.status === "closed"} onChange={(e) => onPick(e.target.checked)} /> : null}
        <div className="grow">
          <Field label="Lead" value={l.text} onCommit={(t) => (t.trim() ? patch({ text: t }) : false)} />
        </div>
        <label>
          Status
          <select className="fld" value={l.status} onChange={(e) => void run({ type: "lead.status", leadId: l.id, status: e.target.value as LeadStatus })}>
            {STATUSES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={l.shown} onChange={(e) => void patch({ shown: e.target.checked })} />
          Shown
        </label>
        <button type="button" className="btn small icon" aria-label="Move up" disabled={first} onClick={() => void run({ type: "lead.move", leadId: l.id, dir: -1 })}>
          <UpIcon />
        </button>
        <button type="button" className="btn small icon" aria-label="Move down" disabled={last} onClick={() => void run({ type: "lead.move", leadId: l.id, dir: 1 })}>
          <DownIcon />
        </button>
      </div>
      <div className="inline">
        <label>
          About
          <select className="fld" value={l.entryId ?? ""} onChange={(e) => void patch({ entryId: e.target.value || null })}>
            <option value="">Nothing in particular</option>
            {all.map((e) => (
              <option key={e.id} value={e.id}>
                {kindInfo(e.kind).label}: {e.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Points to
          <select className="fld" value={l.placeId ?? ""} onChange={(e) => void patch({ placeId: e.target.value || null })}>
            <option value="">Elsewhere</option>
            {places.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Job flyer
          <select className="fld" value={l.jobId ?? ""} onChange={(e) => void patch({ jobId: e.target.value || null })}>
            <option value="">None</option>
            {(s.jobs ?? []).map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn small" onClick={() => void run({ type: "lead.remove", leadId: l.id }, "Removed.")}>
          Delete
        </button>
      </div>
      {l.shown && !visible && about ? <p className="note">Players won&rsquo;t see this until {about.name} is at least a rumor.</p> : null}
      <Field label="DM note (only you see this)" value={l.dmNote} onCommit={(t) => patch({ dmNote: t })} />
    </li>
  );
}
