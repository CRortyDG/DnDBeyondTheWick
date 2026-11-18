"use client";

import { useState, type ReactNode } from "react";
import { FEATURE, FEATURES, featureOn, featuresOffOf, UNLOCK_LABEL, waitsToUnlock, GROUP_LABEL, playerOff, PRESETS, presetOf, presetOff, type FeatureDef, type FeatureGroup, type FeatureId, type PresetId } from "@/shared/features";
import type { DmCommand } from "@/shared/commands";
import { useDm } from "./context";
import { PageHead } from "./PageHead";

const SHOWS_LABEL = { dm: "You", tv: "TV", phone: "Phones" } as const;
const GROUPS: FeatureGroup[] = ["table", "world", "story", "dm"];

/** An on/off switch whose truth lives on the server. */
export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => unknown; label: string; disabled?: boolean }) {
  const [pending, setPending] = useState<boolean | null>(null);
  const shown = pending ?? on;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={shown}
      aria-label={label}
      disabled={disabled}
      className={`ft-switch${shown ? " on" : ""}`}
      onClick={() => {
        const v = !shown;
        setPending(v);
        void Promise.resolve(onChange(v)).finally(() => setPending(null));
      }}
    >
      <span className="ft-knob" aria-hidden="true" />
    </button>
  );
}

/** How many tabs a phone gets with these switches (Fight comes and goes with fights). */
function phoneTabs(on: (id: FeatureId) => boolean): string[] {
  const tabs: string[] = [];
  if (on("chronicle")) tabs.push("Story");
  if (on("discover")) tabs.push("Discover");
  if (on("maps")) tabs.push("Map");
  if (on("sheets")) tabs.push("Character");
  else if (on("journal")) tabs.push("Journal");
  if (on("gold")) tabs.push("Gold");
  if (on("jobs")) tabs.push("Jobs");
  return tabs;
}

/**
 * The Features page: turn whole parts of the app on or off for this campaign,
 * or one player at a time. Off hides, it never deletes.
 */
export function FeaturesPanel() {
  const { view, run } = useDm();
  const s = view.state;
  const off = featuresOffOf(s);
  const preset = presetOf(off);
  const on = (id: FeatureId) => featureOn(s, id);
  const players = s.players.filter((p) => !p.archived);
  const fightOn = !!s.fight && s.fight.status !== "over";
  const tabs = phoneTabs(on);

  const setOff = (next: FeatureId[], msg?: string) => run({ type: "features.set", off: next }, msg);
  const flip = (f: FeatureDef, v: boolean) =>
    setOff(v ? off.filter((x) => x !== f.id) : [...off, f.id], v ? `${f.name} is on.` : `${f.name} is off. Nothing was deleted; turn it back on any time.`);
  const pick = (p: PresetId) => setOff(presetOff(p, off), `${PRESETS.find((x) => x.id === p)!.name}: switches set.`);

  return (
    <div className="pg ft-page">
      <PageHead
        title="Features"
        sub="Turn parts of the app on or off. Off hides a feature everywhere; nothing is deleted."
        help={
          <>
            <p>Each switch hides a feature on your console, the TV and every phone at once. Turning it back on brings everything back as it was.</p>
            <p>Some features can be turned off for one player (say, someone who keeps their sheet on D&amp;D Beyond). Players can also hide a few tabs on their own phone; that only tidies their phone.</p>
            <p>Your tools only tidy your sidebar. Players never see them.</p>
          </>
        }
        stats={[
          { label: "Preset", value: preset === "custom" ? "Custom" : PRESETS.find((p) => p.id === preset)!.name, tone: "gold" },
          { label: "Features on", value: `${FEATURES.filter((f) => f.group !== "dm" && on(f.id)).length} of ${FEATURES.filter((f) => f.group !== "dm").length}` },
          { label: "Phone tabs", value: tabs.length ? tabs.join(", ") : "None (dice only)" },
        ]}
      />

      <section className="ft-presets" aria-label="Presets">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className={`ft-preset${preset === p.id ? " on" : ""}`} aria-pressed={preset === p.id} onClick={() => void pick(p.id)}>
            <b>{p.name}</b>
            <span>{p.blurb}</span>
          </button>
        ))}
        {preset === "custom" ? <p className="note ft-custom">Custom: your own mix. Pick a preset to reset every switch.</p> : null}
      </section>

      {GROUPS.map((g) => (
        <section key={g} className="ft-group" aria-labelledby={`ft-g-${g}`}>
          <h3 id={`ft-g-${g}`}>{GROUP_LABEL[g]}</h3>
          {g === "dm" ? <p className="note ft-group-note">These only tidy your sidebar. Players never see them.</p> : null}
          <ul className="ft-rows">
            {FEATURES.filter((f) => f.group === g && !f.unlisted).map((f) => (
              <FeatureRow
                key={f.id}
                f={f}
                own={!off.includes(f.id)}
                live={on(f.id)}
                blocked={f.needs && !on(f.needs) ? `Needs ${FEATURE[f.needs].name} on.` : f.id === "combat" && fightOn && !off.includes("combat") ? "End the fight first." : undefined}
                onFlip={(v) => flip(f, v)}
                players={f.perPlayer && on(f.id) ? players : undefined}
                more={on(f.id) ? <SubOptions id={f.id} /> : null}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function FeatureRow({
  f,
  own,
  live,
  blocked,
  onFlip,
  players,
  more,
}: {
  f: FeatureDef;
  /** Its own switch. */
  own: boolean;
  /** On once what it needs is counted. */
  live: boolean;
  blocked?: string;
  onFlip: (v: boolean) => unknown;
  players?: { id: string; name: string; character?: string; featuresOff?: FeatureId[]; sheetOff?: boolean }[];
  more?: ReactNode;
}) {
  const { run } = useDm();
  const [open, setOpen] = useState(false);
  const offFor = players?.filter((p) => playerOff(p, f.id)) ?? [];
  return (
    <li className={`ft-row${live ? "" : " off"}`}>
      <div className="ft-row-main">
        <div className="ft-row-text">
          <b>{f.name}</b>
          <span className="ft-blurb">{f.blurb}</span>
          <span className="ft-tags">
            {f.shows.map((w) => (
              <span key={w} className="ft-tag">
                {SHOWS_LABEL[w]}
              </span>
            ))}
            {blocked ? <span className="ft-why">{blocked}</span> : null}
          </span>
        </div>
        <Switch on={own && live} disabled={!!blocked} label={f.name} onChange={onFlip} />
      </div>
      {players ? (
        <div className="ft-per">
          <button type="button" className="linkish ft-per-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {offFor.length ? `Off for ${offFor.map((p) => p.character || p.name).join(", ")}` : "On for every player"} · {open ? "Done" : "Set per player"}
          </button>
          {open ? (
            <ul className="ft-players">
              {players.map((p) => (
                <li key={p.id}>
                  <span>{p.character || p.name}</span>
                  <Switch
                    on={!playerOff(p, f.id)}
                    label={`${f.name} for ${p.character || p.name}`}
                    onChange={(v) => run({ type: "features.player", playerId: p.id, feature: f.id, on: v } as DmCommand, v ? `${f.name} on for ${p.character || p.name}.` : `${f.name} off for ${p.character || p.name}.`)}
                  />
                </li>
              ))}
              {!players.length ? <li className="note">No players yet.</li> : null}
            </ul>
          ) : null}
        </div>
      ) : null}
      {more}
    </li>
  );
}

/** The smaller switches that used to live on their own pages, folded under their feature. */
function SubOptions({ id }: { id: FeatureId }) {
  const { view, run } = useDm();
  const s = view.state;
  const opts: { key: string; label: string; on: boolean; set: (v: boolean) => unknown }[] = [];
  if (id === "renown") {
    opts.push({ key: "plaque", label: "Renown plaque on the notice board", on: !s.plaqueHidden, set: (v) => run({ type: "board.plaque", shown: v }) });
    opts.push({ key: "progress", label: "Players see progress to the next rank", on: !!s.renownProgress, set: (v) => run({ type: "renown.progress", on: v }) });
  }
  if (id === "discover") opts.push({ key: "totals", label: "Counters show how much is left to find", on: !!s.discoveryTotals, set: (v) => run({ type: "discovery.totals", on: v }) });
  if (id === "gold") opts.push({ key: "unlock-gold", label: UNLOCK_LABEL.gold, on: waitsToUnlock(s, "gold"), set: (v) => run({ type: "features.unlock", feature: "gold", on: v }, v ? "New players won't see Gold until a shop opens to them." : "Gold shows from the start.") });
  if (id === "sound") opts.push({ key: "auto", label: "Moments bring their own sounds (dice, fights, rank-ups)", on: !s.sound?.autoOff, set: (v) => run({ type: "sound.set", auto: v }) });
  if (!opts.length) return null;
  return (
    <ul className="ft-subs">
      {opts.map((o) => (
        <li key={o.key}>
          <span>{o.label}</span>
          <Switch on={o.on} label={o.label} onChange={o.set} />
        </li>
      ))}
    </ul>
  );
}
