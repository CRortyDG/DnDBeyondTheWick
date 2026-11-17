"use client";

import { useEffect, useState } from "react";
import { NAME_FIELD_MAX, type CharacterSheet, type SheetPatch } from "@/shared/sheet";
import { FEATURE_NOTE_MAX, FEATURES_MAX, featureFrom, featureNow, RESET_NAME, RESETS, RESOURCES, suggestedFeatures, USES_MAX, type SheetAct, type SheetFeature } from "@/shared/sheetMagic";

const newId = () => Math.random().toString(36).slice(2, 10);

let textCache: Record<string, string> | null = null;
/** The SRD text of the class resources the app counts (small, loaded on first look). */
function useFeatureText(want: boolean) {
  const [t, setT] = useState(textCache);
  useEffect(() => {
    if (!want || textCache) return;
    let live = true;
    void import("../srd/features.json").then((m) => {
      textCache = m.default as Record<string, string>;
      if (live) setT(textCache);
    });
    return () => {
      live = false;
    };
  }, [want]);
  return t;
}

/** Features with uses: Rage, Second Wind, a wand's charges. Tap a pip to use one; rests bring them back. */
export function FeaturesBlock({ sheet, level, editing, send, act }: { sheet: CharacterSheet; level: number | undefined; editing: boolean; send: (p: SheetPatch) => Promise<boolean>; act: (a: SheetAct) => Promise<boolean> }) {
  const [open, setOpen] = useState<string | null>(null);
  const list = sheet.features ?? [];
  const suggest = suggestedFeatures(sheet, level);
  const text = useFeatureText(!!open);
  if (!editing && !list.length && !suggest.length) return null;
  const save = (next: SheetFeature[]) => send({ features: next });
  return (
    <section className="cs-block cs-features" aria-label="Features with uses">
      <h3 className="cs-h">Features with uses</h3>
      {list.length ? (
        <ul className="cs-list">
          {list.map((f) =>
            editing ? (
              <li key={f.id} className="cs-spell-edit">
                <FeatureCard f={f} sheet={sheet} level={level} onSave={(x) => save(list.map((y) => (y.id === f.id ? x : y)))} onRemove={() => save(list.filter((y) => y.id !== f.id))} />
              </li>
            ) : (
              <FeatureRow key={f.id} f={f} sheet={sheet} level={level} act={act} open={open === f.id} onOpen={() => setOpen(open === f.id ? null : f.id)} text={f.auto ? text?.[f.auto] : undefined} />
            ),
          )}
        </ul>
      ) : null}
      {suggest.length && list.length < FEATURES_MAX ? (
        <div className="cs-suggest">
          <span className="note">From your class:</span>
          {suggest.map((k) => (
            <button key={k} type="button" className="cs-chip add" onClick={() => void save([...list, featureFrom(k, newId())])}>
              + {RESOURCES[k].name}
            </button>
          ))}
        </div>
      ) : null}
      {editing && list.length < FEATURES_MAX ? (
        <button type="button" className="btn small cs-add" onClick={() => void save([...list, { id: newId(), name: "New feature", max: 1, used: 0, reset: "long" }])}>
          + Add a feature
        </button>
      ) : null}
      {editing ? <p className="note">The ones from your class keep their uses in step with your level. Add your own for feats, species traits or a magic item&rsquo;s charges.</p> : null}
    </section>
  );
}

function FeatureRow({ f, sheet, level, act, open, onOpen, text }: { f: SheetFeature; sheet: CharacterSheet; level: number | undefined; act: (a: SheetAct) => Promise<boolean>; open: boolean; onOpen: () => void; text?: string }) {
  const { max, reset, left } = featureNow(sheet, f, level);
  const pips = max > 0 && max <= 8;
  return (
    <li className="cs-feature">
      <button type="button" className="cs-feat-name" aria-expanded={open} onClick={onOpen}>
        <span className="cs-name">{f.name}</span>
        <span className="cs-feat-reset">{RESET_NAME[reset]}</span>
      </button>
      {pips ? (
        <div className="cs-hd-pips" role="group" aria-label={`${f.name}: ${left} of ${max} left. Tap to use one or get it back.`}>
          {Array.from({ length: max }, (_, j) => {
            const used = j >= left;
            return <button key={j} type="button" className={`cs-pip${used ? " used" : ""}`} aria-label={used ? `Used: tap to get one back` : `Tap to use one`} onClick={() => void act({ k: "feature", featureId: f.id, delta: used ? -1 : 1 })} />;
          })}
        </div>
      ) : (
        <div className="cs-counter">
          <button type="button" className="btn small" aria-label={`Use one ${f.name}`} disabled={left <= 0} onClick={() => void act({ k: "feature", featureId: f.id, delta: 1 })}>
            &minus;
          </button>
          <b aria-live="polite">
            {left}
            <small>/{max}</small>
          </b>
          <button type="button" className="btn small" aria-label={`Get one ${f.name} back`} disabled={left >= max} onClick={() => void act({ k: "feature", featureId: f.id, delta: -1 })}>
            +
          </button>
        </div>
      )}
      {open ? (
        <div className="cs-spell-detail">
          {f.note ? <div className="cs-prose cs-spell-text">{f.note}</div> : null}
          {f.auto ? text ? <div className="cs-prose cs-spell-text">{text.replace(/\*\*/g, "")}</div> : <p className="note">Loading&hellip;</p> : null}
          {!f.note && !f.auto ? <p className="note">Add a note about it in Edit sheet.</p> : null}
        </div>
      ) : null}
    </li>
  );
}

function FeatureCard({ f, sheet, level, onSave, onRemove }: { f: SheetFeature; sheet: CharacterSheet; level: number | undefined; onSave: (f: SheetFeature) => Promise<boolean>; onRemove: () => void }) {
  const [d, setD] = useState(f);
  useEffect(() => setD(f), [f]);
  const commit = (next: SheetFeature) => {
    setD(next);
    if (JSON.stringify(next) !== JSON.stringify(f)) void onSave(next);
  };
  const now = featureNow(sheet, d, level);
  return (
    <div className="cs-atk-card">
      <div className="cs-atk-row">
        <label className="cs-field cs-grow">
          <span>Name</span>
          <input className="fld" value={d.name} maxLength={NAME_FIELD_MAX} onChange={(e) => setD({ ...d, name: e.target.value })} onBlur={() => commit(d)} />
        </label>
        <label className="cs-field cs-small">
          <span>Uses</span>
          <input
            className="fld"
            inputMode="numeric"
            value={d.auto ? String(now.max) : String(d.max)}
            disabled={!!d.auto}
            onChange={(e) => setD({ ...d, max: Math.min(USES_MAX, Math.max(0, Math.round(Number(e.target.value)) || 0)) })}
            onBlur={() => commit({ ...d, used: Math.min(d.used, d.max) })}
          />
        </label>
        <label className="cs-field">
          <span>Comes back</span>
          <select className="fld" value={d.auto ? now.reset : d.reset} disabled={!!d.auto} onChange={(e) => commit({ ...d, reset: e.target.value as SheetFeature["reset"] })}>
            {RESETS.map((r) => (
              <option key={r} value={r}>
                {RESET_NAME[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="cs-field">
        <span>Note</span>
        <textarea className="fld" rows={2} maxLength={FEATURE_NOTE_MAX} value={d.note ?? ""} placeholder="What it does, the die it rolls" onChange={(e) => setD({ ...d, note: e.target.value })} onBlur={() => commit(d)} />
      </label>
      <div className="cs-atk-row">
        <span className="cs-atk-sum">{d.auto ? "From your class: uses follow your level" : "Your own"}</span>
        <button type="button" className="btn small" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}
