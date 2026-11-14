"use client";

// Leads on a phone: the vote (if one is open), then every lead the party knows
// of, grouped by the place it points to.

import { useEffect, useState } from "react";
import type { LeadsView, PublicLead } from "@/shared/leads";

type Send = (c: object) => Promise<string | null>;

export function groupByPlace(leads: PublicLead[]): { place: string; leads: PublicLead[] }[] {
  const groups = new Map<string, { place: string; leads: PublicLead[] }>();
  for (const l of leads) {
    const key = l.place?.id ?? "";
    const g = groups.get(key) ?? { place: l.place?.name ?? "Elsewhere", leads: [] };
    g.leads.push(l);
    groups.set(key, g);
  }
  // "Elsewhere" last.
  return [...groups.entries()].sort(([a], [b]) => (a === "" ? 1 : 0) - (b === "" ? 1 : 0)).map(([, g]) => g);
}

const STATUS: Record<PublicLead["status"], string> = { open: "Open", followed: "Following", closed: "Closed" };

export function Leads({ leads: view, send }: { leads: LeadsView; send: Send }) {
  const open = view.leads.filter((l) => l.status !== "closed");
  const closed = view.leads.filter((l) => l.status === "closed");
  if (!view.leads.length && !view.vote) return null;
  return (
    <section className="box leads" aria-label="Leads">
      <div className="box-head">
        <h2>Leads</h2>
        <span className="note">{open.length} open</span>
      </div>
      {view.vote ? <VoteCard view={view} send={send} /> : null}
      {groupByPlace(open).map((g) => (
        <div key={g.place} className="lead-group">
          <h3>{g.place}</h3>
          <ul className="lead-list">
            {g.leads.map((l) => (
              <LeadLine key={l.id} lead={l} />
            ))}
          </ul>
        </div>
      ))}
      {closed.length ? (
        <details className="lead-closed">
          <summary className="note">{closed.length} closed</summary>
          <ul className="lead-list">
            {closed.map((l) => (
              <LeadLine key={l.id} lead={l} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function LeadLine({ lead: l }: { lead: PublicLead }) {
  return (
    <li className={`lead lead-${l.status}`}>
      <span className="lead-text">{l.text}</span>
      <span className="note lead-meta">
        {l.status !== "open" ? <span className={`lead-status lead-status-${l.status}`}>{STATUS[l.status]}</span> : null}
        {l.about ? <span>About {l.about.name}</span> : null}
        {l.flyer ? <span>Flyer: {l.flyer.title}</span> : null}
      </span>
    </li>
  );
}

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function VoteCard({ view, send }: { view: LeadsView; send: Send }) {
  const v = view.vote!;
  const now = useClock();
  const closed = v.closed || (v.closesAt !== undefined && now >= v.closesAt);
  const [busy, setBusy] = useState(false);
  const left = v.closesAt && !closed ? Math.max(0, Math.round((v.closesAt - now) / 1000)) : 0;
  const clock = left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "";
  return (
    <div className="vote-card">
      <h3>{closed ? "The vote" : "Vote: what next?"}</h3>
      <p className="note">
        {closed
          ? v.winnerId
            ? "The table has chosen."
            : v.tied
              ? "A tie. The DM decides."
              : "Closed. Counting…"
          : `One vote each; you can change it until it closes.${clock ? ` Closes in ${clock}.` : ""}`}
      </p>
      <ul className="vote-options">
        {v.leadIds.map((id) => {
          const l = view.leads.find((x) => x.id === id);
          const mine = v.mine === id;
          const won = v.winnerId === id;
          return (
            <li key={id}>
              <button
                type="button"
                className={`btn vote-option${mine ? " mine" : ""}${won ? " won" : ""}`}
                disabled={closed || busy}
                aria-pressed={mine}
                onClick={async () => {
                  setBusy(true);
                  await send({ type: "me.vote", leadId: id });
                  setBusy(false);
                }}
              >
                <span className="vote-text">{l?.text ?? "?"}</span>
                <span className="vote-count">{v.counts[id] ?? 0}</span>
                {v.voters[id]?.length ? <span className="note vote-who">{v.voters[id].join(", ")}</span> : null}
                {won ? <span className="badge">Chosen</span> : mine ? <span className="badge">Your vote</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
