"use client";

// "+ Add to this beat": what landing on a beat does, picked from a small
// panel with tabs (Show, Sound, Effect, Fight, Bank) and a search box,
// instead of one long dropdown.

import { useEffect, useMemo, useRef, useState } from "react";
import type { BeatAction } from "@/shared/types";
import { listAssets, type Asset, type AssetGame } from "@/shared/assets";
import { monstersOf } from "@/shared/combat";
import { MIXES, SFX, SFX_GROUPS } from "@/shared/sound";
import type { GameState } from "@/shared/types";
import "./actionAdder.css";

type Tab = "show" | "sound" | "effect" | "fight" | "bank";
const TABS: { id: Tab; label: string }[] = [
  { id: "show", label: "Show on TV" },
  { id: "sound", label: "Music & ambience" },
  { id: "effect", label: "Sound effect" },
  { id: "fight", label: "Fight" },
  { id: "bank", label: "Bank" },
];

/** Show groups in a sensible order; anything new goes at the end. */
const GROUP_ORDER = ["People", "Places", "Shops", "Monsters", "Items", "Maps", "Pins", "Props", "Notes", "Ambient", "Screens"];

interface Option {
  key: string;
  label: string;
  sub?: string;
  /** For search results: which tab it's from. */
  kind: string;
  action: BeatAction;
}

export function ActionAdder({ g, onAdd, disabled }: { g: GameState; onAdd: (a: BeatAction) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("show");
  const [group, setGroup] = useState<string>("");
  const [q, setQ] = useState("");
  const [tap, setTap] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const assets = useMemo(() => (open ? listAssets(g as AssetGame) : []), [open, g]);
  const groups = useMemo(() => {
    const gs = [...new Set(assets.map((a) => a.group))];
    return gs.sort((a, b) => rank(a) - rank(b));
  }, [assets]);
  const curGroup = groups.includes(group) ? group : groups[0] ?? "";

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", down);
    search.current?.focus();
    return () => window.removeEventListener("pointerdown", down);
  }, [open]);

  const all = useMemo<Option[]>(() => {
    if (!open) return [];
    const out: Option[] = assets.map((a) => showOption(a));
    for (const m of MIXES) out.push({ key: `sound:${m.id}`, label: m.label, sub: "Music & ambience", kind: "Sound", action: { type: "sound", mix: m.id } });
    out.push({ key: "sound:off", label: "Fade to silence", kind: "Sound", action: { type: "sound", mix: "off" } });
    for (const x of SFX) out.push({ key: `sfx:${x.id}`, label: x.label, sub: "Sound effect", kind: "Effect", action: { type: "sfx", id: x.id, ...(tap ? { tap: true } : {}) } });
    for (const m of monstersOf(g)) out.push({ key: `fight:${m.id}`, label: `Fight: ${m.name}`, sub: "Roll initiative on the TV", kind: "Fight", action: { type: "fight", monsters: [{ name: m.name, count: 1 }] } });
    out.push({ key: "bank", label: "Bank", sub: "Purse on the TV, the bank on your screen", kind: "Bank", action: { type: "bank" } });
    return out;
  }, [open, assets, g, tap]);

  const pick = (a: BeatAction) => {
    onAdd(a);
    setOpen(false);
    setQ("");
  };

  const term = q.trim().toLowerCase();
  const results = term
    ? all
        .map((o) => ({ o, s: score(o, term) }))
        .filter((x) => x.s < 9)
        .sort((a, b) => a.s - b.s)
        .slice(0, 40)
        .map((x) => x.o)
    : [];

  return (
    <div className="aa" ref={box}>
      <button type="button" className="btn small aa-open" aria-expanded={open} disabled={disabled} onClick={() => setOpen((v) => !v)}>
        + Add to this beat
      </button>
      {open ? (
        <div
          className="aa-panel"
          role="dialog"
          aria-label="Add to this beat"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <input ref={search} className="fld aa-search" type="search" placeholder="Search people, places, maps, sounds, monsters…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />

          {term ? (
            <ul className="aa-list" aria-label="Results">
              {results.length ? (
                results.map((o) => <Row key={o.key} o={o} tag={o.kind} onPick={pick} />)
              ) : (
                <li className="note aa-empty">Nothing called that.</li>
              )}
            </ul>
          ) : (
            <>
              <div className="seg aa-tabs" role="tablist">
                {TABS.map((t) => (
                  <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`btn small${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "show" ? (
                <div className="aa-show">
                  <div className="aa-groups" role="tablist" aria-label="What kind">
                    {groups.map((gr) => (
                      <button key={gr} type="button" role="tab" aria-selected={gr === curGroup} className={`aa-chip${gr === curGroup ? " on" : ""}`} onClick={() => setGroup(gr)}>
                        {gr} <span className="aa-count">{assets.filter((a) => a.group === gr).length}</span>
                      </button>
                    ))}
                  </div>
                  <ul className="aa-list">
                    {assets
                      .filter((a) => a.group === curGroup)
                      .map((a) => {
                        const o = showOption(a);
                        return <Row key={o.key} o={o} onPick={pick} />;
                      })}
                  </ul>
                </div>
              ) : null}

              {tab === "sound" ? (
                <div className="aa-grid">
                  {MIXES.map((m) => (
                    <button key={m.id} type="button" className="btn small aa-pad" onClick={() => pick({ type: "sound", mix: m.id })}>
                      {m.label}
                    </button>
                  ))}
                  <button type="button" className="btn small aa-pad" onClick={() => pick({ type: "sound", mix: "off" })}>
                    Fade to silence
                  </button>
                </div>
              ) : null}

              {tab === "effect" ? (
                <div className="aa-fx">
                  <div className="seg aa-when" role="group" aria-label="When it plays">
                    <button type="button" className={`btn small${!tap ? " on" : ""}`} aria-pressed={!tap} onClick={() => setTap(false)}>
                      Play as I land
                    </button>
                    <button type="button" className={`btn small${tap ? " on" : ""}`} aria-pressed={tap} onClick={() => setTap(true)}>
                      A button I tap
                    </button>
                  </div>
                  {SFX_GROUPS.map((gr) => (
                    <section key={gr.id}>
                      <h4 className="aa-h">{gr.label}</h4>
                      <div className="aa-grid">
                        {SFX.filter((x) => x.group === gr.id).map((x) => (
                          <button key={x.id} type="button" className="btn small aa-pad" onClick={() => pick({ type: "sfx", id: x.id, ...(tap ? { tap: true } : {}) })}>
                            {x.label}
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}

              {tab === "fight" ? (
                monstersOf(g).length ? (
                  <ul className="aa-list">
                    {monstersOf(g).map((m) => (
                      <Row key={m.id} o={{ key: m.id, label: m.name, sub: "Set how many in the beat text", kind: "Fight", action: { type: "fight", monsters: [{ name: m.name, count: 1 }] } }} onPick={pick} />
                    ))}
                  </ul>
                ) : (
                  <p className="note aa-empty">No monsters yet. Add them under Monsters.</p>
                )
              ) : null}

              {tab === "bank" ? (
                <ul className="aa-list">
                  <Row o={{ key: "bank", label: "Open the bank", sub: "Purse on the TV, the bank on your screen", kind: "Bank", action: { type: "bank" } }} onPick={pick} />
                </ul>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Row({ o, tag, onPick }: { o: Option; tag?: string; onPick: (a: BeatAction) => void }) {
  return (
    <li>
      <button type="button" className="aa-row" onClick={() => onPick(o.action)}>
        <span className="aa-row-main">
          <span className="aa-row-label">{o.label}</span>
          {o.sub ? <span className="aa-row-sub">{o.sub}</span> : null}
        </span>
        {tag ? <span className="aa-tag">{tag}</span> : null}
      </button>
    </li>
  );
}

function showOption(a: Asset): Option {
  return { key: `show:${a.ref}`, label: a.label, sub: a.sub, kind: a.group, action: { type: "show", ref: a.ref } };
}

function rank(group: string) {
  const i = GROUP_ORDER.indexOf(group);
  return i < 0 ? 50 : i;
}

function score(o: Option, term: string): number {
  const l = o.label.toLowerCase();
  if (l.startsWith(term)) return 0;
  if (l.split(/\s+/).some((w) => w.startsWith(term))) return 1;
  if (l.includes(term)) return 2;
  if ((o.sub ?? "").toLowerCase().includes(term) || o.kind.toLowerCase().startsWith(term)) return 3;
  return 9;
}
