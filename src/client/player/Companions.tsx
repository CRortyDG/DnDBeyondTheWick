"use client";

// Companions and hirelings on a player's phone: a small card each for everyone,
// and for whoever runs one, its stat block (what the DM lets them see), its HP,
// its abilities, its turn in a fight, and its death saves.

import { ConditionChips } from "../ui/ConditionChips";
import { useState } from "react";
import type { PlayerView } from "@/shared/projection";
import type { ControlledCompanion, PublicCompanion } from "@/shared/companions";
import { HEALTH_LABEL } from "@/shared/combat";
import { formatCp } from "@/shared/money";
import { Sheet } from "./Sheet";

type Go = (c: object) => Promise<boolean>;

export function healthText(c: Pick<PublicCompanion, "health" | "hp"> & { combat?: boolean }): string {
  if (c.health === "dead") return "Dead";
  if (c.combat === false) return "Stays back from fights";
  if (c.hp) return `${c.hp.cur} / ${c.hp.max} HP`;
  return HEALTH_LABEL[c.health];
}

/** "With the party": one chip per companion. Mine open their card. */
export function CompanionStrip({ view, send }: { view: PlayerView; send: (c: object) => Promise<string | null> }) {
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  if (!view.companions.length) return null;
  const mine = new Map(view.myCompanions.map((c) => [c.id, c]));
  const go: Go = async (c) => {
    const err = await send(c);
    setMsg(err);
    return !err;
  };
  const opened = open ? mine.get(open) : undefined;
  return (
    <section className="pl-comps" aria-label="With the party">
      <span className="pl-comps-k">With the party</span>
      {view.companions.map((c) => {
        const own = mine.has(c.id);
        const body = (
          <>
            <span className="pl-comp-av" aria-hidden="true">
              {(c.name.trim()[0] ?? "?").toUpperCase()}
            </span>
            <span className="pl-comp-txt">
              <span className="pl-comp-name">{c.name}</span>
              <span className="pl-comp-sub">
                {healthText(c)} · {own ? "you run them" : `run by ${c.controller}`}
                {c.purseCp ? ` · has ${formatCp(c.purseCp)}` : ""}
              </span>
            </span>
          </>
        );
        return own ? (
          <button key={c.id} type="button" className="pl-comp mine" aria-haspopup="dialog" onClick={() => setOpen(c.id)}>
            {body}
          </button>
        ) : (
          <span key={c.id} className="pl-comp" title={c.offers || undefined}>
            {body}
          </span>
        );
      })}
      {opened ? (
        <Sheet title={opened.name} onClose={() => (setOpen(null), setMsg(null))} className="pl-comp-sheet">
          <CompanionPanel c={opened} go={go} active={false} />
          {msg ? (
            <p className="error-text" role="alert">
              {msg}
            </p>
          ) : null}
        </Sheet>
      ) : null}
    </section>
  );
}

/** The controller's card. active: it's their turn in the fight (End turn shows). */
export function CompanionPanel({ c, go, active }: { c: ControlledCompanion; go: Go; active: boolean }) {
  const [amt, setAmt] = useState("");
  const n = Number(amt);
  const hp = (mode: "damage" | "heal" | "temp") => n > 0 && go({ type: "me.companionHp", companionId: c.id, mode, amount: Math.floor(n) }).then((ok) => ok && setAmt(""));
  const saving = !!c.deathSaves;
  const pct = c.hp ? Math.max(0, Math.min(100, (c.hp.cur / Math.max(1, c.hp.max)) * 100)) : 0;
  return (
    <div className={`pl-comp-card${active ? " active" : ""}`} aria-label={`${c.name}'s card`}>
      <div className="pl-comp-head">
        <strong>{c.name}</strong>
        <span className="pl-comp-stats">
          {c.ac !== undefined ? <span>AC {c.ac}</span> : null}
          {c.initBonus !== undefined ? <span>Init {c.initBonus >= 0 ? `+${c.initBonus}` : c.initBonus}</span> : null}
          {c.speed ? <span>{c.speed}</span> : null}
        </span>
      </div>
      {c.offers ? <p className="pl-comp-offers">{c.offers}</p> : null}
      {c.conditions?.length ? <ConditionChips list={c.conditions} label={`${c.name}'s conditions`} /> : null}
      {c.health === "dead" ? <p className="fc-big">{c.name} has died.</p> : null}
      {saving && c.deathSaves ? (
        <CompanionSaves c={c} saves={c.deathSaves} go={go} />
      ) : c.combat && c.health !== "dead" ? (
        <div className="fc-hp pl-hp" aria-label={`${c.name}'s HP`}>
          <div className="pl-hp-top">
            <span>Hit points</span>
            <span>{c.hp ? `${c.hp.cur} / ${c.hp.max}${c.hp.temp ? ` +${c.hp.temp} temp` : ""}` : HEALTH_LABEL[c.health]}</span>
          </div>
          {c.hp ? (
            <span className={`fx-bar pl-hp-bar${pct <= 25 ? " low" : pct <= 50 ? " mid" : ""}`}>
              <span style={{ width: `${pct}%` }} />
            </span>
          ) : null}
          <div className="fc-hp-change">
            <input className="fld" inputMode="numeric" aria-label={`Amount for ${c.name}`} placeholder="0" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            <button className="btn" type="button" disabled={!(n > 0)} onClick={() => hp("damage")}>
              Damage
            </button>
            <button className="btn" type="button" disabled={!(n > 0)} onClick={() => hp("heal")}>
              Heal
            </button>
            <button className="btn" type="button" disabled={!(n > 0)} onClick={() => hp("temp")}>
              Temp
            </button>
          </div>
        </div>
      ) : null}
      {c.attacks?.length ? (
        <ul className="pl-comp-list" aria-label="Attacks">
          {c.attacks.map((a, i) => (
            <li key={i}>
              <strong>{a.name}</strong> {a.bonus >= 0 ? `+${a.bonus}` : a.bonus} to hit{a.damage ? `, ${a.damage}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {c.abilities?.length ? (
        <ul className="pl-comp-list" aria-label="Abilities">
          {c.abilities.map((a) => {
            const max = a.uses ?? 1;
            const limited = !!a.uses || !!a.recharge;
            const left = max - a.spent;
            return (
              <li key={a.id} className={limited && left <= 0 ? "spent" : undefined}>
                <strong>{a.name}</strong>
                {a.uses ? ` (${left} of ${a.uses} left)` : a.recharge ? ` (recharge ${a.recharge >= 6 ? "6" : `${a.recharge}–6`}${a.spent ? ", used" : ""})` : ""}
                {a.text ? <span className="pl-comp-text"> {a.text}</span> : null}
                {limited ? (
                  <span className="pl-comp-acts">
                    <button className="btn small" type="button" disabled={left <= 0} onClick={() => go({ type: "me.companionAbility", companionId: c.id, abilityId: a.id, act: "use" })}>
                      Mark used
                    </button>
                    {a.spent ? (
                      <button className="btn small" type="button" onClick={() => go({ type: "me.companionAbility", companionId: c.id, abilityId: a.id, act: "unuse" })}>
                        {a.recharge ? "Recharged" : "Undo"}
                      </button>
                    ) : null}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {c.resist ? <p className="note">Resists: {c.resist}</p> : null}
      {active ? (
        <div className="pl-fight-end">
          <button className="btn primary big" type="button" onClick={() => go({ type: "me.companionEndTurn", companionId: c.id })}>
            End {c.name}&rsquo;s turn
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CompanionSaves({ c, saves, go }: { c: ControlledCompanion; saves: { ok: number; fail: number }; go: Go }) {
  const mark = (m: string) => go({ type: "me.companionDeathSave", companionId: c.id, mark: m });
  const stable = saves.ok >= 3;
  return (
    <div className="fc-saves" aria-label={`${c.name}'s death saves`}>
      <div className="fc-big">{stable ? `${c.name} is stable` : `${c.name} is at 0 HP`}</div>
      <p className="note">Roll a d20 for them on their turn: 10 or higher is a success.</p>
      <div className="fc-saves-row">
        <span>Successes</span>
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            className={`fc-dot ok${i < saves.ok ? " on" : ""}`}
            aria-label={`Success ${i + 1}${i < saves.ok ? ", marked" : ""}`}
            onClick={() => mark(i < saves.ok ? "unok" : "ok")}
          />
        ))}
      </div>
      <div className="fc-saves-row">
        <span>Failures</span>
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            className={`fc-dot fail${i < saves.fail ? " on" : ""}`}
            aria-label={`Failure ${i + 1}${i < saves.fail ? ", marked" : ""}`}
            onClick={() => mark(i < saves.fail ? "unfail" : "fail")}
          />
        ))}
      </div>
      <button className="btn primary" type="button" onClick={() => mark("nat20")}>
        Natural 20: back up with 1 HP
      </button>
    </div>
  );
}

/** Setup: a companion's initiative (a typed number), or "acts right after you". */
export function CompanionInit({ c, go, follows }: { c: ControlledCompanion; go: Go; follows: boolean }) {
  const [t, setT] = useState(c.init === null || c.init === undefined ? "" : String(c.init));
  if (follows) return <p className="note pl-comp-init">{c.name} acts right after you.</p>;
  return (
    <form
      className="pl-comp-init"
      onSubmit={(e) => {
        e.preventDefault();
        if (t && t !== "-") go({ type: "me.companionInit", companionId: c.id, init: Number(t) });
      }}
    >
      <label>
        {c.name}&rsquo;s initiative
        {c.initBonus !== undefined ? ` (d20 ${c.initBonus >= 0 ? "+" : "−"} ${Math.abs(c.initBonus)})` : ""}
        <input className="fld" inputMode="numeric" value={t} onChange={(e) => setT(e.target.value.replace(/[^\d-]/g, "").slice(0, 4))} />
      </label>
      <button className="btn" type="submit" disabled={!t || t === "-"}>
        {c.init !== null && c.init !== undefined && String(c.init) === t ? "Sent" : "Send"}
      </button>
    </form>
  );
}

/** My companions' combatant ids in the fight. */
export function myCompanionIds(view: Pick<PlayerView, "myCompanions">): Set<string> {
  return new Set(view.myCompanions.map((c) => c.combatantId).filter((x): x is string => !!x));
}
