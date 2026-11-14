"use client";

// The DM's People tab: the NPC compendium. Write people up ahead of time, with
// key facts that stay locked; they reach the phones once the party meets them
// (their portrait on the TV, or Introduce), and each fact once you reveal it.

import { useState } from "react";
import { FACT_MAX, MOODS, npcArt, npcsOf, npcTags, NPC_BLURB_MAX } from "@/shared/people";
import type { Npc, NpcMood } from "@/shared/types";
import { DownIcon, UpIcon } from "../ui/icons";
import { Portrait } from "../ui/Portrait";
import { PersonNotes, notesAbout } from "../ui/PersonNotes";
import { Field } from "./Field";
import { useDm } from "./context";

export function PeoplePanel() {
  const { view, run } = useDm();
  const s = view.state;
  const people = npcsOf(s);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const met = people.filter((n) => n.met).length;

  return (
    <div className="people-panel">
      <p className="note">
        Players only ever see people they&rsquo;ve met, and only the facts you&rsquo;ve revealed. Showing someone&rsquo;s portrait on the TV for the first time introduces them; for anyone else, press Introduce. Your notes never leave this
        screen. Notes about someone are Chronicle notes tagged with their name.
      </p>
      <div className="box-head">
        <h3>People</h3>
        <span className="note">
          {met} of {people.length} met
        </span>
      </div>
      <ol className="scene-list people-list">
        {people.map((n, i) => (
          <PersonRow key={n.id} npc={n} first={i === 0} last={i === people.length - 1} open={openId === n.id} onToggle={() => setOpenId(openId === n.id ? null : n.id)} />
        ))}
      </ol>
      <form
        className="box form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          const ok = await run({ type: "npc.add", npc: { name: newName } }, "Added. Nobody sees them until the party meets them.");
          if (ok) setNewName("");
        }}
      >
        <h3>Add someone</h3>
        <div className="inline">
          <label className="grow">
            Name
            <input className="fld" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Old Hannet the smith" />
          </label>
          <button className="btn primary" type="submit" disabled={!newName.trim()}>
            Add
          </button>
        </div>
        <span className="note">Give them a portrait by picking one of your portrait scenes in their entry. A new portrait scene gets an entry by itself the first time you show it.</span>
      </form>
    </div>
  );
}

function PersonRow({ npc: n, first, last, open, onToggle }: { npc: Npc; first: boolean; last: boolean; open: boolean; onToggle: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const known = n.facts.filter((f) => f.revealedAt !== undefined).length;
  const notes = notesAbout(view.chronicle, npcTags(s, n)).length;
  return (
    <li className={`scene-item person-item${n.met ? " met" : ""}`}>
      <div className="scene-row">
        <Portrait art={npcArt(s, n)} name={n.name} className="person-face small" />
        <span className="scene-label">
          {n.name}
          {n.title ? <span className="note"> · {n.title}</span> : null}
          {n.met ? <span className="tag">met</span> : <span className="tag wax">not met</span>}
          {n.facts.length ? (
            <span className="tag">
              {known}/{n.facts.length} facts known
            </span>
          ) : null}
          {notes ? <span className="tag">{notes === 1 ? "1 note" : `${notes} notes`}</span> : null}
        </span>
        <span className="spacer" />
        <button className="btn small icon" type="button" aria-label={`Move ${n.name} up`} disabled={first} onClick={() => run({ type: "npc.move", npcId: n.id, dir: -1 })}>
          <UpIcon />
        </button>
        <button className="btn small icon" type="button" aria-label={`Move ${n.name} down`} disabled={last} onClick={() => run({ type: "npc.move", npcId: n.id, dir: 1 })}>
          <DownIcon />
        </button>
        {n.met ? (
          <button className="btn small" type="button" onClick={() => run({ type: "npc.show", npcId: n.id }, `${n.name} is on the TV.`)}>
            Show on TV
          </button>
        ) : (
          <button className="btn small primary" type="button" onClick={() => run({ type: "npc.meet", npcId: n.id, met: true, announce: true }, `The party has met ${n.name}.`)}>
            Introduce
          </button>
        )}
        <button className="btn small" type="button" aria-expanded={open} onClick={onToggle}>
          {open ? "Done" : "Edit"}
        </button>
      </div>
      {open ? <PersonEditor npc={n} /> : null}
    </li>
  );
}

function PersonEditor({ npc: n }: { npc: Npc }) {
  const { view, run, call } = useDm();
  const s = view.state;
  const portraits = s.scenes.filter((x) => x.kind === "portrait");
  const patch = (p: Parameters<typeof updateCmd>[1]) => run(updateCmd(n.id, p));
  const [fact, setFact] = useState("");
  const tags = npcTags(s, n);
  const metChapter = n.met?.sessionId ? s.sessions.find((x) => x.id === n.met!.sessionId)?.number : undefined;

  return (
    <div className="person-editor">
      <div className="inline">
        <Field label="Name" value={n.name} onCommit={(v) => (v.trim() ? patch({ name: v }) : false)} />
        <Field label="Title" value={n.title} placeholder="Keeper of the Flickering Candle" onCommit={(v) => patch({ title: v })} />
      </div>
      <Field label="About them (players see this once they've met)" value={n.blurb} multiline onCommit={(v) => patch({ blurb: v.slice(0, NPC_BLURB_MAX) })} />
      <div className="inline">
        <label>
          Portrait
          <select className="fld" value={n.sceneId ?? ""} onChange={(e) => void patch({ sceneId: e.target.value || null })}>
            <option value="">No portrait</option>
            {portraits.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          How they feel about the party
          <select className="fld" value={n.mood ?? ""} onChange={(e) => void patch({ mood: (e.target.value || null) as NpcMood | null })}>
            <option value="">Not shown</option>
            {MOODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h4>Key facts</h4>
      <p className="note">Locked facts are only on your screen. Reveal one when the party learns it: it shows up on their phones right away, and on the TV too if you pick that.</p>
      {n.facts.length ? (
        <ol className="person-fact-list">
          {n.facts.map((f, i) => {
            const shown = f.revealedAt !== undefined;
            return (
              <li key={f.id} className={shown ? "known" : "locked"}>
                <span className={`tag${shown ? "" : " wax"}`}>{shown ? "known" : "locked"}</span>
                <FactText npcId={n.id} factId={f.id} value={f.text} />
                <span className="person-fact-actions">
                  {shown ? (
                    <>
                      {n.met ? (
                        <button className="btn small" type="button" onClick={() => run({ type: "npc.show", npcId: n.id, factId: f.id }, "On the TV.")}>
                          Show on TV
                        </button>
                      ) : null}
                      <button className="btn small" type="button" onClick={() => run({ type: "npc.factReveal", npcId: n.id, factId: f.id, revealed: false })}>
                        Lock again
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn small" type="button" onClick={() => run({ type: "npc.factReveal", npcId: n.id, factId: f.id, revealed: true }, n.met ? "Revealed on their phones." : `Revealed. It shows once they meet ${n.name}.`)}>
                        Reveal
                      </button>
                      {n.met ? (
                        <button className="btn small primary" type="button" onClick={() => run({ type: "npc.factReveal", npcId: n.id, factId: f.id, revealed: true, tv: true }, "Revealed, and on the TV.")}>
                          Reveal on TV
                        </button>
                      ) : null}
                    </>
                  )}
                  <button className="btn small icon" type="button" aria-label="Move fact up" disabled={i === 0} onClick={() => run({ type: "npc.factMove", npcId: n.id, factId: f.id, dir: -1 })}>
                    <UpIcon />
                  </button>
                  <button className="btn small icon" type="button" aria-label="Move fact down" disabled={i === n.facts.length - 1} onClick={() => run({ type: "npc.factMove", npcId: n.id, factId: f.id, dir: 1 })}>
                    <DownIcon />
                  </button>
                  <button
                    className="btn small danger"
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this fact?")) void run({ type: "npc.factRemove", npcId: n.id, factId: f.id });
                    }}
                  >
                    Delete
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="note">No facts yet.</p>
      )}
      <form
        className="inline"
        onSubmit={async (e) => {
          e.preventDefault();
          if (fact.trim() && (await run({ type: "npc.factAdd", npcId: n.id, text: fact }))) setFact("");
        }}
      >
        <label className="grow">
          New fact (starts locked)
          <input className="fld" value={fact} maxLength={FACT_MAX} onChange={(e) => setFact(e.target.value)} placeholder="Owes the harbourmaster a favour" />
        </label>
        <button className="btn" type="submit" disabled={!fact.trim()}>
          Add fact
        </button>
      </form>

      <Field label="DM notes (only you see this)" value={n.dmNote} multiline onCommit={(v) => patch({ dmNote: v })} />

      <h4>Meeting</h4>
      {n.met ? (
        <div className="inline">
          <span>
            Met{metChapter ? ` in Chapter ${metChapter}` : ""}, {new Date(n.met.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}.
          </span>
          <button
            className="btn small"
            type="button"
            onClick={() => {
              if (confirm(`Make ${n.name} a stranger again? They leave the phones; notes about them stay in the Chronicle.`)) void run({ type: "npc.meet", npcId: n.id, met: false, announce: false });
            }}
          >
            Back to a stranger
          </button>
        </div>
      ) : (
        <div className="inline">
          <button className="btn primary" type="button" onClick={() => run({ type: "npc.meet", npcId: n.id, met: true, announce: true }, `The party has met ${n.name}.`)}>
            Introduce on the TV
          </button>
          <button className="btn" type="button" onClick={() => run({ type: "npc.meet", npcId: n.id, met: true, announce: false }, `${n.name} is on their phones.`)}>
            Add to phones quietly
          </button>
        </div>
      )}

      <h4>Notes about {n.name}</h4>
      <PersonNotes view={view.chronicle} tags={tags} name={n.name} send={async (c) => (await call(c as never)).error} />

      <button
        className="btn small danger"
        type="button"
        onClick={() => {
          if (confirm(`Delete ${n.name} from the compendium? Notes about them stay in the Chronicle.`)) void run({ type: "npc.remove", npcId: n.id }, "Deleted.");
        }}
      >
        Delete {n.name}
      </button>
    </div>
  );
}

function updateCmd(npcId: string, patch: { name?: string; title?: string; blurb?: string; sceneId?: string | null; mood?: NpcMood | null; dmNote?: string }) {
  return { type: "npc.update" as const, npcId, patch };
}

function FactText({ npcId, factId, value }: { npcId: string; factId: string; value: string }) {
  const { run } = useDm();
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  if (!editing && v !== value) setV(value);
  return (
    <input
      className="fld person-fact-text"
      aria-label="Fact"
      value={v}
      maxLength={FACT_MAX}
      onFocus={() => setEditing(true)}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (v.trim() && v.trim() !== value) void run({ type: "npc.factUpdate", npcId, factId, text: v });
        else setV(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
