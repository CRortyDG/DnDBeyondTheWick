"use client";

// A character's morality and oath, in their Players drawer: where they sit on
// the alignment chart, one quick form to log what they did, the oath (for
// paladins, or anyone given a vow) with its tenets and strain, and the history.
// The campaign's settings sit at the bottom, folded away.

import { useState } from "react";
import {
  ALIGNMENTS,
  alignmentOf,
  DEED_REASON_MAX,
  deedMoves,
  drift,
  isPaladin,
  moralitySettings,
  OATH_NAME_MAX,
  OATH_RULES,
  OATH_STATE_LABEL,
  oathPresetFor,
  oathState,
  strainOf,
  TENETS_MAX,
  type AlignmentId,
  type Conduct,
  type Deed,
  type MoralitySettings,
} from "@/shared/morality";
import { featureOn, featureOnFor } from "@/shared/features";
import type { DmPlayer } from "@/shared/projection";
import { useDm } from "./context";
import { MoralityChart } from "../ui/MoralityChart";

type Dir = -1 | 0 | 1;

/** Deeds a DM reaches for: one tap fills the reason and the direction. */
const QUICK: { text: string; law: Dir; good: Dir }[] = [
  { text: "Kept their word", law: 1, good: 0 },
  { text: "Followed orders", law: 1, good: 0 },
  { text: "Broke the law", law: -1, good: 0 },
  { text: "Lied", law: -1, good: 0 },
  { text: "Showed mercy", law: 0, good: 1 },
  { text: "Helped a stranger", law: 0, good: 1 },
  { text: "Cruelty", law: 0, good: -1 },
  { text: "Stole", law: -1, good: -1 },
  { text: "Betrayed an ally", law: -1, good: -1 },
];

const SHOW: { id: MoralitySettings["show"]; label: string }[] = [
  { id: "none", label: "Nothing" },
  { id: "label", label: "Their alignment only (Neutral Good)" },
  { id: "chart", label: "Their alignment and the chart" },
  { id: "reasons", label: "The chart and the reasons" },
];

/** Where they stood before each of their last few deeds, oldest first. */
function trailOf(c: Conduct, n = 5): { law: number; good: number }[] {
  const out: { law: number; good: number }[] = [];
  let law = c.law;
  let good = c.good;
  for (const d of [...(c.log ?? [])].reverse()) {
    // Where the DM placed them is where the story starts: no trail before it.
    if (d.source === "set") break;
    if (!d.law && !d.good) continue;
    law -= d.law;
    good -= d.good;
    out.unshift({ law, good });
    if (out.length >= n) break;
  }
  return out;
}

function Seg<T extends string | number>({ label, value, options, onPick }: { label: string; value: T; options: { v: T; label: string }[]; onPick: (v: T) => void }) {
  return (
    <div className="seg mor-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} type="button" className={`btn small${value === o.v ? " on" : ""}`} aria-pressed={value === o.v} onClick={() => onPick(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ConductBox({ p }: { p: DmPlayer }) {
  const { view, run, toggleWhisper } = useDm();
  const s = view.state;
  const set = moralitySettings(s);
  const on = featureOnFor(s, p, "morality");
  const c = p.conduct;
  const [reason, setReason] = useState("");
  const [law, setLaw] = useState<Dir>(0);
  const [good, setGood] = useState<Dir>(0);
  const [size, setSize] = useState(1);
  const [oath, setOath] = useState<"" | "upheld" | "broke">("");
  const [tenet, setTenet] = useState("");
  const [secret, setSecret] = useState(false);
  const [editingOath, setEditingOath] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const who = p.character?.trim() || p.name;
  const placed = !!c?.placed;
  const here = c && placed ? alignmentOf(c.law, c.good) : undefined;
  const st = oathState(c, set.warnAt);
  const strain = strainOf(c);

  const reset = () => {
    setReason("");
    setLaw(0);
    setGood(0);
    setSize(1);
    setOath("");
    setTenet("");
    setSecret(false);
  };
  const logDeed = async () => {
    const ok = await run({
      type: "conduct.deed",
      playerId: p.id,
      reason: reason.trim(),
      law: law * size,
      good: good * size,
      ...(oath ? { oath } : {}),
      ...(oath && tenet ? { tenet } : {}),
      ...(secret ? { secret: true } : {}),
    });
    if (ok) reset();
  };
  const canLog = (!!law || !!good || !!oath) && (!!reason.trim() || (!!oath && !!tenet));
  const log = [...(c?.log ?? [])].reverse();
  const shown = showAll ? log : log.slice(0, 6);
  const chapter = (sid?: string) => (sid ? s.sessions.find((x) => x.id === sid)?.number : undefined);
  const preset = oathPresetFor(p);

  return (
    <section className="mor" aria-label="Morality and oath">
      <h3>Morality</h3>
      {!on ? <p className="note">Morality and oaths are off{s.featuresOff?.includes("morality") ? " in Features" : ` for ${who}`}, so their phone shows none of this. You can still keep the log.</p> : null}
      <div className="mor-head">
        {here ? <span className="mor-label">{here.label}</span> : <span className="note">Not placed yet. Pick where they start, or just log a deed.</span>}
        {c && placed && drift(c) ? <span className="note">{drift(c)}</span> : null}
        <span className="spacer" />
        <label className="mor-set">
          <span className="sr-only">Set alignment</span>
          <select className="fld" value={here?.id ?? ""} aria-label="Set alignment" onChange={(ev) => void run({ type: "conduct.set", playerId: p.id, alignment: (ev.target.value || null) as AlignmentId | null })}>
            <option value="">{placed ? "Clear morality" : "Set alignment…"}</option>
            {ALIGNMENTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {c && placed ? <MoralityChart law={c.law} good={c.good} trail={trailOf(c)} /> : null}

      <div className="mor-form">
        <input className="fld" value={reason} maxLength={DEED_REASON_MAX} onChange={(ev) => setReason(ev.target.value)} placeholder="What did they do? e.g. Spared the bandit leader" aria-label="What they did" />
        <div className="att-chips" aria-label="Quick deeds">
          {QUICK.map((q) => (
            <button
              key={q.text}
              type="button"
              className={`att-chip${reason === q.text ? " on" : ""}`}
              onClick={() => {
                if (reason === q.text) return reset();
                setReason(q.text);
                setLaw(q.law);
                setGood(q.good);
              }}
            >
              {q.text}
            </button>
          ))}
        </div>
        <div className="mor-axes">
          <Seg<Dir> label="Order" value={law} onPick={setLaw} options={[{ v: 1, label: "Lawful" }, { v: 0, label: "–" }, { v: -1, label: "Chaotic" }]} />
          <Seg<Dir> label="Morals" value={good} onPick={setGood} options={[{ v: 1, label: "Good" }, { v: 0, label: "–" }, { v: -1, label: "Evil" }]} />
          <Seg<number> label="How much" value={size} onPick={setSize} options={[{ v: 1, label: "Small" }, { v: 2, label: "Big" }, { v: 3, label: "Huge" }]} />
        </div>
        {c?.oath ? (
          <div className="mor-axes">
            <Seg<"" | "upheld" | "broke"> label="Their oath" value={oath} onPick={setOath} options={[{ v: "", label: "Oath: –" }, { v: "upheld", label: "Upheld a tenet" }, { v: "broke", label: "Broke a tenet" }]} />
            {oath && c.oath.tenets.length ? (
              <select className="fld mor-tenet" value={tenet} onChange={(ev) => setTenet(ev.target.value)} aria-label="Which tenet">
                <option value="">Which tenet?</option>
                {c.oath.tenets.map((t) => (
                  <option key={t} value={t}>
                    {t.length > 60 ? `${t.slice(0, 58)}…` : t}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : null}
        <div className="inline mor-go">
          <label className="check" title="Their phone never shows the reason">
            <input type="checkbox" checked={secret} onChange={(ev) => setSecret(ev.target.checked)} /> Keep it secret
          </label>
          <span className="spacer" />
          <button type="button" className="btn small primary" disabled={!canLog} onClick={() => void logDeed()}>
            Log it
          </button>
        </div>
      </div>

      <div className="mor-oath">
        <h4>Oath</h4>
        {c?.oath && !editingOath ? (
          <>
            <div className="mor-head">
              <strong>{c.oath.name}</strong>
              {st ? <span className={`mor-state mor-state-${st}`}>{OATH_STATE_LABEL[st]}</span> : null}
              {strain && st !== "broken" ? <span className="note">{strain === 1 ? "1 transgression" : `${strain} transgressions`} since they last atoned</span> : null}
            </div>
            {st === "atRisk" ? (
              <p className="mor-warn" role="status">
                {who} has broken their oath {strain} times without atoning. Are they an oathbreaker? That&rsquo;s your call. {OATH_RULES}
              </p>
            ) : st === "strained" ? (
              <p className="note">Not broken: they can atone. {OATH_RULES}</p>
            ) : st === "broken" ? (
              <p className="note">You declared it broken. If they find their way back, restore it.</p>
            ) : null}
            {c.oath.tenets.length ? (
              <ol className="mor-tenets">
                {c.oath.tenets.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            ) : (
              <p className="note">No tenets written down yet.</p>
            )}
            <div className="inline mor-oath-actions">
              {st === "strained" || st === "atRisk" ? (
                <button type="button" className="btn small" onClick={() => void run({ type: "conduct.oathMark", playerId: p.id, mark: "atoned", reason: "" }, `${who} atoned. Their oath is kept.`)}>
                  They atoned
                </button>
              ) : null}
              {st !== "broken" ? (
                <button type="button" className="btn small danger" onClick={() => void run({ type: "conduct.oathMark", playerId: p.id, mark: "broken", reason: "" }, `${who}'s oath is broken.`)}>
                  Declare it broken
                </button>
              ) : (
                <button type="button" className="btn small" onClick={() => void run({ type: "conduct.oathMark", playerId: p.id, mark: "restored", reason: "" }, `${who}'s oath is restored.`)}>
                  Restore it
                </button>
              )}
              <span className="spacer" />
              {(st === "strained" || st === "atRisk") && featureOn(s, "whispers") && !p.archived ? (
                <button type="button" className="linkish" title="A sealed note only they see, e.g. Your oath feels strained" onClick={() => toggleWhisper([p.id])}>
                  Whisper them
                </button>
              ) : null}
              <button type="button" className="linkish" onClick={() => setEditingOath(true)}>
                Edit oath
              </button>
            </div>
          </>
        ) : editingOath ? (
          <OathEditor
            initial={c?.oath ?? preset ?? { name: "", tenets: [] }}
            onCancel={() => setEditingOath(false)}
            onSave={async (o) => {
              if (await run({ type: "conduct.oath", playerId: p.id, oath: o })) setEditingOath(false);
            }}
            onRemove={c?.oath ? async () => void ((await run({ type: "conduct.oath", playerId: p.id, oath: null }, "Oath removed.")) && setEditingOath(false)) : undefined}
          />
        ) : (
          <div className="inline">
            <span className="note">{isPaladin(p) ? `${who} is a paladin.` : "For paladins, or anyone who has sworn a vow."}</span>
            <span className="spacer" />
            {isPaladin(p) && preset ? (
              <button type="button" className="btn small" onClick={() => void run({ type: "conduct.oath", playerId: p.id, oath: preset }, `${who} swore the ${preset.name}.`)}>
                Swear the {preset.name}
              </button>
            ) : null}
            <button type="button" className="linkish" onClick={() => setEditingOath(true)}>
              {isPaladin(p) ? "Write a different oath" : "Give them an oath or vow"}
            </button>
          </div>
        )}
      </div>

      {log.length ? (
        <>
          <h5 className="att-h5">What they did</h5>
          <ol className="att-log mor-log">
            {shown.map((d) => (
              <DeedRow key={d.id} d={d} chapter={chapter(d.sessionId)} showToggle={set.show === "reasons" && d.source !== "set" && !!d.reason} onUndo={() => void run({ type: "conduct.undo", playerId: p.id, deedId: d.id }, "Taken back.")} onSecret={() => void run({ type: "conduct.secret", playerId: p.id, deedId: d.id, secret: !d.secret })} />
            ))}
          </ol>
          {log.length > shown.length ? (
            <button type="button" className="linkish" onClick={() => setShowAll(true)}>
              Show all {log.length}
            </button>
          ) : null}
        </>
      ) : null}

      <MoralitySettingsBox />
    </section>
  );
}

const MARK: Record<NonNullable<Deed["oath"]>, string> = { upheld: "Upheld", broke: "Broke", atoned: "Atoned", broken: "Oath broken", restored: "Oath restored" };

function DeedRow({ d, chapter, showToggle, onUndo, onSecret }: { d: Deed; chapter?: number; showToggle: boolean; onUndo: () => void; onSecret: () => void }) {
  const moves = deedMoves(d);
  const tone = d.oath === "broke" || d.oath === "broken" ? "down" : d.oath === "upheld" || d.oath === "atoned" || d.oath === "restored" ? "up" : "";
  return (
    <li className={tone}>
      <span className="att-why">
        {d.reason || (d.tenet ? null : <span className="note">No reason given</span>)}
        {d.oath ? <span className={`mor-mark mor-mark-${tone || "none"}`}>{MARK[d.oath]}{d.tenet ? `: ${d.tenet.split(":")[0]}` : ""}</span> : null}
        <span className="note">
          {moves ? ` · ${moves}` : ""}
          {chapter ? ` · Chapter ${chapter}` : ""}
          {d.secret ? " · secret" : ""}
        </span>
      </span>
      <span className="att-log-actions">
        {showToggle ? (
          <button type="button" className="linkish" onClick={onSecret}>
            {d.secret ? "Show them" : "Hide from them"}
          </button>
        ) : null}
        <button type="button" className="linkish" onClick={onUndo}>
          Undo
        </button>
      </span>
    </li>
  );
}

function OathEditor({ initial, onSave, onCancel, onRemove }: { initial: { name: string; tenets: string[] }; onSave: (o: { name: string; tenets: string[] }) => void; onCancel: () => void; onRemove?: () => void }) {
  const [name, setName] = useState(initial.name);
  const [tenets, setTenets] = useState(initial.tenets.join("\n"));
  const list = tenets
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  return (
    <div className="mor-oath-edit form">
      <label>
        <span className="label">Oath</span>
        <input className="fld" value={name} maxLength={OATH_NAME_MAX} onChange={(ev) => setName(ev.target.value)} placeholder="Oath of Devotion" />
      </label>
      <label>
        <span className="label">Tenets, one per line</span>
        <textarea className="fld" rows={5} value={tenets} onChange={(ev) => setTenets(ev.target.value)} placeholder={"Honesty: don't lie or cheat.\nCourage: never fear to act."} />
      </label>
      {list.length > TENETS_MAX ? <p className="note">Only the first {TENETS_MAX} are kept.</p> : null}
      <div className="inline">
        <button type="button" className="btn small primary" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), tenets: list.slice(0, TENETS_MAX) })}>
          Save oath
        </button>
        <button type="button" className="btn small" onClick={onCancel}>
          Cancel
        </button>
        <span className="spacer" />
        {onRemove ? (
          <button type="button" className="linkish" onClick={onRemove}>
            Remove oath
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** The campaign's morality settings. */
export function MoralitySettingsBox() {
  const { view, run } = useDm();
  const set = moralitySettings(view.state);
  const patch = (x: Partial<MoralitySettings>) => run({ type: "morality.set", patch: x });
  return (
    <details className="att-settings">
      <summary>Morality settings for this campaign</summary>
      <div className="att-settings-body">
        <label>
          Players see
          <select className="fld" value={set.show} onChange={(ev) => void patch({ show: ev.target.value as MoralitySettings["show"] })}>
            {SHOW.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Warn me after
          <select className="fld" value={set.warnAt} onChange={(ev) => void patch({ warnAt: Number(ev.target.value) })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "1 broken tenet" : `${n} broken tenets`} without atoning
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={set.oathShow} onChange={(ev) => void patch({ oathShow: ev.target.checked })} /> Paladins see their oath: its tenets, and whether it&rsquo;s kept, strained or broken
        </label>
        <p className="note">Players only ever see their own. &ldquo;At risk&rdquo; is just for you: their phone says Strained. Secret deeds and the alignment you set never show as reasons.</p>
      </div>
    </details>
  );
}

/** On a player's row: their alignment, and their oath when it's strained or broken. */
export function ConductTag({ p }: { p: DmPlayer }) {
  const { view } = useDm();
  const c = p.conduct;
  if (!c) return null;
  const st = oathState(c, moralitySettings(view.state).warnAt);
  const here = c.placed ? alignmentOf(c.law, c.good) : undefined;
  return (
    <>
      {here ? (
        <span className="tag" title="Their alignment">
          {here.label}
        </span>
      ) : null}
      {st && st !== "kept" ? (
        <span className={`tag mor-state mor-state-${st}`} title={c.oath?.name}>
          Oath {OATH_STATE_LABEL[st].toLowerCase()}
        </span>
      ) : null}
    </>
  );
}
