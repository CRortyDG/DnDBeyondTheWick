"use client";

// Combat mode, the DM's side: a full-screen fight console. DM-only: real names,
// exact HP, AC, attacks, notes and hidden combatants all show here, and the
// TV and phones only ever get the filtered fight view.
//
// Keys: Space next turn, Shift+Space previous, digits type an amount, Enter
// damages the selected, Shift+Enter heals them, Esc clears.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONDITIONS, condLabel, HEALTH_LABEL, healthState, monstersOf, rechargeText, upNext, TIMER_DEFAULT } from "@/shared/combat";
import { chronicleLine } from "@/shared/combatReducer";
import { formatCp, parseAmount } from "@/shared/money";
import type { DmCommand } from "@/shared/commands";
import type { Combatant, Fight, FightReminder, MonsterTemplate, Player } from "@/shared/types";
import { useDm } from "./context";
import { DiceButton } from "./DiceTray";
import "../ui/fight.css";

type DmPlayer = Player & { hasKey: boolean };

export function FightScreen({ onExit }: { onExit: () => void }) {
  const { view, run, toast } = useDm();
  const s = view.state;
  const f = s.fight;
  if (!f) {
    return (
      <div className="fx-root">
        <div className="box fx-empty">
          <h2>No fight going</h2>
          <button className="btn" type="button" onClick={onExit}>
            Back to the DM view
          </button>
        </div>
      </div>
    );
  }
  return <FightConsole key={f.id} f={f} onExit={onExit} run={run} toast={toast} />;
}

function FightConsole({ f, onExit, run, toast }: { f: Fight; onExit: () => void; run: (c: DmCommand, ok?: string) => Promise<boolean>; toast: (m: string) => void }) {
  const { view } = useDm();
  const s = view.state;
  const players = s.players as DmPlayer[];
  const templates = monstersOf(s);
  const tpl = useCallback((id?: string) => templates.find((t) => t.id === id), [templates]);
  const [sel, setSel] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [crit, setCrit] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Forget selections of combatants who've left.
  const ids = f.order.map((c) => c.id).join(",");
  useEffect(() => setSel((xs) => xs.filter((x) => f.order.some((c) => c.id === x))), [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  const hpOf = (c: Combatant) => {
    if (c.kind === "monster") return { cur: c.hp, max: c.maxHp, temp: c.tempHp };
    const p = players.find((x) => x.id === c.playerId);
    return { cur: p?.hp?.cur ?? 0, max: p?.hp?.max ?? 0, temp: p?.hp?.temp ?? 0 };
  };

  const hit = useCallback(
    async (mode: "damage" | "heal" | "temp") => {
      const n = Number(amount);
      if (!amount || !Number.isFinite(n) || n <= 0) return toast("Type an amount first.");
      if (!sel.length) return toast("Pick who it's for: click their rows.");
      if (await run({ type: "fight.hp", combatantIds: sel, mode, amount: Math.floor(n), ...(mode === "damage" && crit ? { crit: true } : {}) })) {
        setAmount("");
        setCrit(false);
      }
    },
    [amount, sel, crit, run, toast],
  );

  const next = useCallback(() => void run({ type: "fight.next" }), [run]);
  const back = useCallback(() => void run({ type: "fight.back" }), [run]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing && t !== amountRef.current) return;
      const k = e.key;
      if (t === amountRef.current) {
        if (k === "Enter") {
          e.preventDefault();
          void hit(e.shiftKey ? "heal" : "damage");
        } else if (k === "Escape") setAmount("");
        return;
      }
      if (k === " " && (f.status === "running" || f.status === "paused")) {
        if (e.shiftKey) back();
        else next();
      } else if (/^[0-9]$/.test(k)) setAmount((a) => (a + k).replace(/^0+(?=\d)/, "").slice(0, 4));
      else if (k === "Backspace" && amount) setAmount((a) => a.slice(0, -1));
      else if (k === "Enter" && amount) void hit(e.shiftKey ? "heal" : "damage");
      else if (k === "Escape") {
        if (amount) setAmount("");
        else if (sel.length) setSel([]);
        else return;
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [f.status, next, back, hit, amount, sel.length]);

  const cur = f.order.find((c) => c.id === f.currentId);
  const nx = upNext(f);
  const active = f.order.filter((c) => !c.gone);
  const gone = f.order.filter((c) => c.gone);
  const notIn = players.filter((p) => !p.archived && !f.order.some((c) => c.playerId === p.id));
  const toggle = (id: string) => setSel((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const statusText = f.status === "setup" ? "Rolling initiative" : f.status === "over" ? "The fight is over" : `Round ${f.round}${f.status === "paused" ? " · paused" : ""}`;
  const live = s.scenes.find((x) => x.id === s.live.sceneId);
  const waiting = f.status === "setup" ? f.order.filter((c) => c.kind === "player" && c.init === null).map((c) => c.name) : [];

  return (
    <div className="fx-root">
      <header className="fx-top">
        <button className="btn small" type="button" onClick={onExit} title="The fight keeps going on the TV">
          ‹ <span className="run-exit-text">DM view</span>
        </button>
        <div className="fx-head">
          <div className="run-ep">
            Fight: {f.title}
            {f.where ? ` · ${f.where}` : ""}
          </div>
          <div className="run-pos" aria-live="polite">
            {statusText}
          </div>
        </div>
        <span className="spacer" />
        <DiceButton small />
        <span className="run-tv" title="What the TV shows">
          TV: {f.status === "paused" ? `${live?.label ?? "the scene"} · Fight paused` : f.status === "setup" ? "Roll initiative!" : f.status === "over" ? "The fight is over" : "turn order"}
        </span>
        {f.status === "running" || f.status === "paused" ? (
          <>
            <button className={`btn small${f.status === "paused" ? " on" : ""}`} type="button" aria-pressed={f.status === "paused"} onClick={() => run({ type: "fight.pause", paused: f.status !== "paused" })}>
              {f.status === "paused" ? "Resume" : "Pause"}
            </button>
            <button className="btn small" type="button" onClick={() => run({ type: "fight.end" })}>
              End fight
            </button>
          </>
        ) : null}
        {f.status === "setup" ? (
          <button className="btn small danger" type="button" onClick={() => run({ type: "fight.cancel" }, "Fight cancelled.").then((ok) => ok && onExit())}>
            Cancel fight
          </button>
        ) : null}
      </header>

      {f.status === "over" ? (
        <EndStep f={f} players={players} onDone={onExit} />
      ) : (
        <div className="fx-body">
          <main className="fx-main">
            {f.status !== "setup" && cur ? (
              <div className="fx-now" aria-live="polite">
                <span className="fx-now-label">Now</span>
                <b>{cur.name}</b>
                {cur.hidden ? <span className="fx-tag">hidden</span> : null}
                {nx ? (
                  <>
                    <span className="fx-now-label">Up next</span> {nx.name}
                  </>
                ) : null}
              </div>
            ) : null}
            {waiting.length ? <p className="note">Waiting on initiative from {waiting.join(", ")}. Their phones are asking; you can type it in too.</p> : null}

            <ol className="fx-order" aria-label="Turn order">
              {active.map((c, i) => (
                <Row
                  key={c.id}
                  c={c}
                  index={i}
                  f={f}
                  hp={hpOf(c)}
                  t={tpl(c.templateId)}
                  selected={sel.includes(c.id)}
                  current={c.id === f.currentId && f.status !== "setup"}
                  isNext={c.id === nx?.id && f.status !== "setup"}
                  open={open === c.id}
                  onToggle={() => toggle(c.id)}
                  typing={!!amount}
                  onOpen={() => setOpen((o) => (o === c.id ? null : c.id))}
                />
              ))}
            </ol>
            {gone.length ? (
              <section className="fx-gone" aria-label="Down">
                <h3>Down</h3>
                <p className="note">Off the TV. Heal one to bring it back.</p>
                <ol className="fx-order">
                  {gone.map((c, i) => (
                    <Row key={c.id} c={c} index={active.length + i} f={f} hp={hpOf(c)} t={tpl(c.templateId)} selected={sel.includes(c.id)} current={false} isNext={false} open={open === c.id} onToggle={() => toggle(c.id)} typing={!!amount} onOpen={() => setOpen((o) => (o === c.id ? null : c.id))} />
                  ))}
                </ol>
              </section>
            ) : null}
          </main>

          <aside className="fx-side">
            <section className="box fx-hit" aria-label="Damage and healing">
              <div className="fx-sel">{sel.length ? `For: ${sel.map((id) => f.order.find((c) => c.id === id)?.name).join(", ")}` : "Click rows to pick who it's for."}</div>
              <div className="fx-amount">
                <input
                  ref={amountRef}
                  className="fld big"
                  inputMode="numeric"
                  aria-label="Amount"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
                <button className={`btn${crit ? " on" : ""}`} type="button" aria-pressed={crit} onClick={() => setCrit((v) => !v)} title="Plays the crit moment on the TV">
                  Crit
                </button>
              </div>
              <div className="fx-hit-btns">
                <button className="btn primary" type="button" onClick={() => hit("damage")}>
                  Damage <span className="key">↵</span>
                </button>
                <button className="btn" type="button" onClick={() => hit("heal")}>
                  Heal <span className="key">⇧↵</span>
                </button>
                <button className="btn" type="button" onClick={() => hit("temp")}>
                  Temp HP
                </button>
              </div>
              <ConditionAdder sel={sel} />
            </section>

            <Reminders f={f} />

            <AddCombatant f={f} templates={templates} notIn={notIn} />

            <section className="box fx-settings" aria-label="Fight settings">
              <h3>This fight</h3>
              <label>
                Where (for the Chronicle)
                <CommitInput value={f.where} placeholder="in the feast hall" onCommit={(v) => run({ type: "fight.settings", where: v })} />
              </label>
              <div className="fx-timer">
                <label className="check">
                  <input type="checkbox" checked={f.timerSec !== null} onChange={(e) => run({ type: "fight.settings", timerSec: e.target.checked ? TIMER_DEFAULT : null })} /> Turn timer (hourglass on the TV)
                </label>
                {f.timerSec !== null ? (
                  <label className="fx-inline">
                    <CommitInput value={String(f.timerSec)} numeric onCommit={(v) => Number(v) >= 10 && run({ type: "fight.settings", timerSec: Math.min(600, Math.round(Number(v))) })} /> seconds
                  </label>
                ) : null}
              </div>
              <label>
                DM notes
                <CommitInput multiline value={f.dmNotes} placeholder="Only you see these." onCommit={(v) => run({ type: "fight.settings", dmNotes: v })} />
              </label>
              <label>
                Scene behind the fight
                <select className="fld" value={s.live.sceneId} onChange={(e) => run({ type: "scene.show", sceneId: e.target.value })}>
                  {s.scenes.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>
            <p className="note hint">Keys: Space next turn · Shift+Space previous · digits type an amount · Enter damage · Shift+Enter heal · Esc clears</p>
          </aside>
        </div>
      )}

      {f.status !== "over" ? (
        <footer className="run-foot fx-foot">
          {f.status === "setup" ? (
            <>
              <button className="btn run-nav" type="button" onClick={() => run({ type: "fight.rollInit" })} disabled={!f.order.some((c) => c.kind === "monster" && c.init === null)}>
                Roll monsters&rsquo; initiative
              </button>
              <button className="btn primary run-nav" type="button" onClick={() => run({ type: "fight.begin" })} disabled={!f.order.length}>
                Begin ›
              </button>
            </>
          ) : (
            <>
              <button className="btn run-nav" type="button" onClick={back}>
                ‹ Previous <span className="key">⇧␣</span>
              </button>
              <button className="btn primary run-nav" type="button" onClick={next}>
                Next turn › <span className="key">␣</span>
              </button>
            </>
          )}
        </footer>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Row({
  c,
  index,
  f,
  hp,
  t,
  selected,
  current,
  isNext,
  open,
  onToggle,
  onOpen,
  typing,
}: {
  typing: boolean;
  c: Combatant;
  index: number;
  f: Fight;
  hp: { cur: number; max: number; temp: number };
  t?: MonsterTemplate;
  selected: boolean;
  current: boolean;
  isNext: boolean;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { run } = useDm();
  const state = c.kind === "monster" ? (c.down ? "down" : healthState(hp.cur, hp.max)) : hp.max > 0 ? healthState(hp.cur, hp.max) : null;
  const [drag, setDrag] = useState(false);
  const pct = hp.max > 0 ? Math.max(0, Math.min(100, (hp.cur / hp.max) * 100)) : 0;
  const others = f.order.filter((x) => x.id !== c.id && !x.gone);
  return (
    <li
      className={`fx-row${selected ? " sel" : ""}${current ? " cur" : ""}${isNext ? " next" : ""}${c.kind === "monster" && c.down ? " down" : ""}${c.hidden ? " hidden" : ""}${drag ? " drag" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", c.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id && id !== c.id) void run({ type: "fight.move", combatantId: id, to: index });
      }}
    >
      <div className="fx-row-main" onClick={onToggle} role="button" tabIndex={0} aria-pressed={selected} onKeyDown={(e) => (e.key === "Enter" && e.target === e.currentTarget && !typing ? onToggle() : null)}>
        <span className="fx-grip" aria-hidden="true">
          ⋮⋮
        </span>
        <InitInput c={c} />
        <div className="fx-name">
          <b>{c.name}</b>
          {c.kind === "monster" && !c.revealed ? <span className="fx-tv">TV: {c.displayName}</span> : null}
          {current ? <span className="fx-tag now">now</span> : isNext ? <span className="fx-tag">next</span> : null}
          {c.hidden ? <span className="fx-tag">hidden from TV</span> : null}
          {c.concentrating ? <span className="fx-tag conc">concentrating</span> : null}
        </div>
        <div className="fx-hp" title={state ? HEALTH_LABEL[state] : "HP not set"}>
          {hp.max > 0 || c.kind === "monster" ? (
            <>
              <span className="fx-hp-num">
                {hp.cur}/{hp.max}
                {hp.temp ? <span className="fx-temp"> +{hp.temp}</span> : null}
              </span>
              <span className={`fx-bar ${state ?? ""}`}>
                <span style={{ width: `${pct}%` }} />
              </span>
              <span className="fx-state">{state ? HEALTH_LABEL[state] : ""}</span>
            </>
          ) : (
            <span className="note">HP not set</span>
          )}
        </div>
        {c.ac !== undefined ? <span className="fx-ac" title="Armor class">AC {c.ac}</span> : null}
      </div>
      {c.conditions.length || (c.deathSaves && c.kind === "player") ? (
        <div className="fx-chips">
          {c.conditions.map((k) => (
            <span key={k.id} className="beat-action-chip">
              {condLabel(k)}
              {k.rounds !== undefined ? ` · ${k.rounds} rd${k.rounds === 1 ? "" : "s"} (${k.tick})` : ""}
              <button type="button" className="chip-x" aria-label={`Remove ${condLabel(k)} from ${c.name}`} onClick={() => run({ type: "fight.uncondition", combatantId: c.id, conditionId: k.id })}>
                ×
              </button>
            </span>
          ))}
          {c.kind === "player" && c.deathSaves ? <DeathSaves c={c} /> : null}
        </div>
      ) : null}
      {t?.abilities.some((a) => a.recharge || a.uses) ? (
        <div className="fx-abilities">
          {t.abilities
            .filter((a) => a.recharge || a.uses)
            .map((a) => {
              const spent = c.spent[a.id] ?? 0;
              if (a.recharge)
                return (
                  <span key={a.id} className={`fx-ab${spent ? " used" : ""}`}>
                    {a.name} (Recharge {rechargeText(a.recharge)}): {spent ? "used" : "ready"}
                    {spent ? (
                      <>
                        <button className="btn small" type="button" onClick={() => run({ type: "fight.ability", combatantId: c.id, abilityId: a.id, act: "roll" })}>
                          Roll d6
                        </button>
                        <button className="btn small" type="button" onClick={() => run({ type: "fight.ability", combatantId: c.id, abilityId: a.id, act: "recharged" })}>
                          Recharged
                        </button>
                      </>
                    ) : (
                      <button className="btn small" type="button" onClick={() => run({ type: "fight.ability", combatantId: c.id, abilityId: a.id, act: "use" })}>
                        Mark used
                      </button>
                    )}
                  </span>
                );
              return (
                <label key={a.id} className="check fx-ab">
                  <input type="checkbox" checked={spent >= (a.uses ?? 1)} onChange={(e) => run({ type: "fight.ability", combatantId: c.id, abilityId: a.id, act: e.target.checked ? "use" : "unuse" })} /> {a.name} ({a.uses}/day)
                  {(a.uses ?? 1) > 1 ? ` · ${spent} used` : ""}
                </label>
              );
            })}
        </div>
      ) : null}
      <div className="fx-row-tools">
        <button className="btn small" type="button" onClick={onOpen} aria-expanded={open}>
          {open ? "Less" : "More"}
        </button>
        <button className={`btn small${c.concentrating ? " on" : ""}`} type="button" aria-pressed={c.concentrating} onClick={() => run({ type: "fight.patch", combatantIds: [c.id], patch: { concentrating: !c.concentrating } })}>
          Concentrating
        </button>
        <button className={`btn small${c.hidden ? " on" : ""}`} type="button" aria-pressed={c.hidden} onClick={() => run({ type: "fight.patch", combatantIds: [c.id], patch: { hidden: !c.hidden } })}>
          {c.hidden ? "Show on TV" : "Hide from TV"}
        </button>
        {c.kind === "monster" && c.displayName && c.displayName !== c.name ? (
          <button className={`btn small${c.revealed ? " on" : ""}`} type="button" aria-pressed={c.revealed} onClick={() => run({ type: "fight.patch", combatantIds: [c.id], patch: { revealed: !c.revealed } })}>
            {c.revealed ? "Name revealed" : "Reveal name"}
          </button>
        ) : null}
        {f.status !== "setup" ? (
          <select className="fld small-select" aria-label={`Delay ${c.name}: act after…`} value="" onChange={(e) => e.target.value && run({ type: "fight.delay", combatantId: c.id, afterId: e.target.value })}>
            <option value="">Delay: act after…</option>
            {others.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {open ? <RowDetails c={c} t={t} hp={hp} /> : null}
    </li>
  );
}

function InitInput({ c }: { c: Combatant }) {
  const { run } = useDm();
  return (
    <span className="fx-init" onClick={(e) => e.stopPropagation()}>
      <CommitInput
        value={c.init === null ? "" : String(c.init)}
        numeric
        placeholder="–"
        label={`Initiative for ${c.name}`}
        onCommit={(v) => {
          const t = v.trim();
          if (t === "") return run({ type: "fight.init", combatantId: c.id, init: null });
          const n = Number(t);
          if (!Number.isInteger(n) || n < -99 || n > 999) return false;
          return run({ type: "fight.init", combatantId: c.id, init: n });
        }}
      />
    </span>
  );
}

function DeathSaves({ c }: { c: Combatant }) {
  const { run } = useDm();
  const ds = c.deathSaves ?? { ok: 0, fail: 0 };
  const mark = (m: "ok" | "fail" | "nat20" | "unok" | "unfail") => run({ type: "fight.deathSave", combatantId: c.id, mark: m });
  return (
    <span className="fx-saves" aria-label={`Death saves: ${ds.ok} successes, ${ds.fail} failures`}>
      Saves
      <button type="button" className="btn small" onClick={() => mark("ok")} onContextMenu={(e) => (e.preventDefault(), void mark("unok"))} title="Click: success · right-click: undo">
        ✓ {ds.ok}/3
      </button>
      <button type="button" className="btn small" onClick={() => mark("fail")} onContextMenu={(e) => (e.preventDefault(), void mark("unfail"))} title="Click: failure · right-click: undo">
        ✗ {ds.fail}/3
      </button>
      <button type="button" className="btn small" onClick={() => mark("nat20")}>
        Nat 20
      </button>
    </span>
  );
}

function RowDetails({ c, t, hp }: { c: Combatant; t?: MonsterTemplate; hp: { cur: number; max: number; temp: number } }) {
  const { run } = useDm();
  return (
    <div className="fx-details">
      <div className="fx-detail-grid">
        <label>
          HP
          <CommitInput numeric value={String(hp.cur)} onCommit={(v) => Number.isInteger(Number(v)) && run({ type: "fight.setHp", combatantId: c.id, hp: Math.max(0, Number(v)) })} />
        </label>
        <label>
          Max HP
          <CommitInput numeric value={String(hp.max)} onCommit={(v) => Number.isInteger(Number(v)) && run({ type: "fight.setHp", combatantId: c.id, maxHp: Math.max(0, Number(v)) })} />
        </label>
        <label>
          Temp HP
          <CommitInput numeric value={String(hp.temp)} onCommit={(v) => Number.isInteger(Number(v)) && run({ type: "fight.setHp", combatantId: c.id, tempHp: Math.max(0, Number(v)) })} />
        </label>
        {c.kind === "monster" ? (
          <label>
            TV name
            <CommitInput value={c.displayName} onCommit={(v) => run({ type: "fight.patch", combatantIds: [c.id], patch: { displayName: v } })} />
          </label>
        ) : null}
      </div>
      {t ? (
        <div className="fx-stat">
          <div>
            <b>{t.name}</b> · AC {t.ac} · HP {t.hp} · Init {t.initBonus >= 0 ? "+" : ""}
            {t.initBonus}
            {t.speed ? ` · Speed ${t.speed}` : ""}
          </div>
          {t.attacks.map((a, i) => (
            <div key={i}>
              {a.name}: {a.bonus >= 0 ? "+" : ""}
              {a.bonus} to hit, {a.damage}
            </div>
          ))}
          {t.abilities.map((a) => (
            <div key={a.id}>
              <i>{a.name}</i>
              {a.recharge ? ` (Recharge ${rechargeText(a.recharge)})` : a.uses ? ` (${a.uses}/day)` : a.onDeath ? " (when it dies)" : ""}: {a.text}
            </div>
          ))}
          {t.resist ? <div>Resistant: {t.resist}</div> : null}
          {t.immune ? <div>Immune: {t.immune}</div> : null}
          {t.notes ? <div className="note">{t.notes}</div> : null}
          {t.dmNote ? <div className="note">DM note: {t.dmNote}</div> : null}
        </div>
      ) : null}
      <label>
        Note on {c.name}
        <CommitInput multiline value={c.note ?? ""} placeholder="Only you see this." onCommit={(v) => run({ type: "fight.patch", combatantIds: [c.id], patch: { note: v } })} />
      </label>
      <button className="btn small danger" type="button" onClick={() => run({ type: "fight.remove", combatantId: c.id })}>
        Remove from the fight
      </button>
    </div>
  );
}

function ConditionAdder({ sel }: { sel: string[] }) {
  const { run, toast } = useDm();
  const [name, setName] = useState<string>("Prone");
  const [custom, setCustom] = useState("");
  const [rounds, setRounds] = useState("");
  const [level, setLevel] = useState("1");
  const [tick, setTick] = useState<"start" | "end">("end");
  const add = async () => {
    if (!sel.length) return toast("Pick who it's for: click their rows.");
    const n = name === "custom" ? custom.trim() : name;
    if (!n) return toast("Name the condition.");
    const r = Number(rounds);
    const ok = await run({
      type: "fight.condition",
      combatantIds: sel,
      name: n,
      ...(n === "Exhaustion" ? { level: Math.max(1, Math.min(6, Number(level) || 1)) } : {}),
      ...(rounds && r > 0 ? { rounds: Math.min(100, Math.floor(r)), tick } : {}),
    });
    if (ok) setRounds("");
  };
  return (
    <div className="fx-cond" role="group" aria-label="Add a condition">
      <select className="fld" aria-label="Condition" value={name} onChange={(e) => setName(e.target.value)}>
        {CONDITIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value="custom">Custom…</option>
      </select>
      {name === "custom" ? <input className="fld" aria-label="Custom condition" placeholder="Hexed" value={custom} maxLength={40} onChange={(e) => setCustom(e.target.value)} /> : null}
      {name === "Exhaustion" ? (
        <select className="fld" aria-label="Exhaustion level" value={level} onChange={(e) => setLevel(e.target.value)}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              Level {n}
            </option>
          ))}
        </select>
      ) : null}
      <input className="fld fx-rounds" inputMode="numeric" aria-label="Rounds (blank: until removed)" placeholder="rounds" value={rounds} onChange={(e) => setRounds(e.target.value.replace(/\D/g, "").slice(0, 3))} />
      {rounds ? (
        <select className="fld" aria-label="Counts down at" value={tick} onChange={(e) => setTick(e.target.value as "start" | "end")}>
          <option value="end">at the end of their turn</option>
          <option value="start">at the start of their turn</option>
        </select>
      ) : null}
      <button className="btn" type="button" onClick={add}>
        Add condition
      </button>
    </div>
  );
}

function Reminders({ f }: { f: Fight }) {
  const { run } = useDm();
  if (!f.reminders.length) return null;
  return (
    <section className="box fx-reminders" aria-label="Reminders" aria-live="polite">
      <div className="box-head">
        <h3>Reminders</h3>
        <button className="btn small" type="button" onClick={() => run({ type: "fight.dismiss" })}>
          Clear all
        </button>
      </div>
      <ul>
        {[...f.reminders].reverse().map((r) => (
          <ReminderLine key={r.id} r={r} />
        ))}
      </ul>
    </section>
  );
}

function ReminderLine({ r }: { r: FightReminder }) {
  const { run } = useDm();
  return (
    <li className={`fx-rem ${r.kind}`}>
      <span>{r.text}</span>
      {r.kind === "recharge" && r.combatantId && r.abilityId ? (
        <>
          <button className="btn small primary" type="button" onClick={() => run({ type: "fight.ability", combatantId: r.combatantId!, abilityId: r.abilityId!, act: "roll" })}>
            Roll d6
          </button>
          <button className="btn small" type="button" onClick={() => run({ type: "fight.ability", combatantId: r.combatantId!, abilityId: r.abilityId!, act: "recharged" })}>
            Recharged
          </button>
        </>
      ) : null}
      <button className="btn small" type="button" aria-label="Dismiss" onClick={() => run({ type: "fight.dismiss", reminderId: r.id })}>
        OK
      </button>
    </li>
  );
}

function AddCombatant({ f, templates, notIn }: { f: Fight; templates: MonsterTemplate[]; notIn: DmPlayer[] }) {
  const { run, toast } = useDm();
  const [tid, setTid] = useState("");
  const [count, setCount] = useState("1");
  const [where, setWhere] = useState<string>("roll");
  const [init, setInit] = useState("");
  const [quick, setQuick] = useState({ name: "", init: "", hp: "", ac: "" });
  const pick = templates.find((t) => t.id === tid) ?? templates[0];
  const setup = f.status === "setup";
  const placement = () => {
    if (where === "roll") return {};
    if (where === "init") {
      const n = Number(init);
      return init.trim() && Number.isInteger(n) ? { init: n } : null;
    }
    return { after: where.slice(6) };
  };
  const addTpl = async () => {
    if (!pick) return toast("Add a monster under Monsters first.");
    const p = placement();
    if (!p) return toast("Type the initiative.");
    if (await run({ type: "fight.add", templateId: pick.id, count: Math.max(1, Math.min(20, Number(count) || 1)), ...p })) setCount("1");
  };
  const addQuick = async () => {
    const name = quick.name.trim();
    const hp = Number(quick.hp);
    if (!name || !(hp > 0)) return toast("A one-off needs a name and HP.");
    const p = placement();
    const i = quick.init.trim() ? Number(quick.init) : null;
    const ok = await run({ type: "fight.addQuick", name, init: i !== null && Number.isInteger(i) ? i : null, hp: Math.floor(hp), ac: Math.max(0, Math.floor(Number(quick.ac) || 10)), ...(p && "after" in p ? { after: p.after } : {}) });
    if (ok) setQuick({ name: "", init: "", hp: "", ac: "" });
  };
  return (
    <section className="box fx-add" aria-label="Add to the fight">
      <h3>Add to the fight</h3>
      {templates.length ? (
        <div className="fx-add-row">
          <select className="fld" aria-label="Monster" value={pick?.id ?? ""} onChange={(e) => setTid(e.target.value)}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input className="fld fx-rounds" inputMode="numeric" aria-label="How many" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, "").slice(0, 2))} />
          <button className="btn" type="button" onClick={addTpl}>
            Add
          </button>
        </div>
      ) : (
        <p className="note">No monsters yet. Add templates under Monsters in the DM view.</p>
      )}
      {!setup ? (
        <div className="fx-add-row">
          <select className="fld" aria-label="Where it goes in the order" value={where} onChange={(e) => setWhere(e.target.value)}>
            <option value="roll">Roll its initiative</option>
            <option value="init">At initiative…</option>
            {f.order
              .filter((c) => !c.gone)
              .map((c) => (
                <option key={c.id} value={`after:${c.id}`}>
                  Right after {c.name}
                </option>
              ))}
          </select>
          {where === "init" ? <input className="fld fx-rounds" inputMode="numeric" aria-label="Initiative" value={init} onChange={(e) => setInit(e.target.value.replace(/[^\d-]/g, "").slice(0, 3))} /> : null}
        </div>
      ) : null}
      <details className="fx-quick">
        <summary>Quick one-off</summary>
        <div className="fx-add-row">
          <input className="fld" aria-label="Name" placeholder="Name" value={quick.name} maxLength={80} onChange={(e) => setQuick({ ...quick, name: e.target.value })} />
          <input className="fld fx-rounds" inputMode="numeric" aria-label="Initiative" placeholder="Init" value={quick.init} onChange={(e) => setQuick({ ...quick, init: e.target.value.replace(/[^\d-]/g, "").slice(0, 3) })} />
          <input className="fld fx-rounds" inputMode="numeric" aria-label="HP" placeholder="HP" value={quick.hp} onChange={(e) => setQuick({ ...quick, hp: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
          <input className="fld fx-rounds" inputMode="numeric" aria-label="AC" placeholder="AC" value={quick.ac} onChange={(e) => setQuick({ ...quick, ac: e.target.value.replace(/\D/g, "").slice(0, 2) })} />
          <button className="btn" type="button" onClick={addQuick}>
            Add
          </button>
        </div>
      </details>
      {notIn.length ? (
        <div className="fx-add-row">
          <span className="note">Players not in it:</span>
          {notIn.map((p) => (
            <button key={p.id} className="btn small" type="button" onClick={() => run({ type: "fight.addPlayer", playerId: p.id })}>
              + {p.character?.trim() || p.name}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// The end: loot, the Chronicle, back to the scene.

function EndStep({ f, players, onDone }: { f: Fight; players: DmPlayer[]; onDone: () => void }) {
  const { run } = useDm();
  const inFight = useMemo(() => players.filter((p) => f.order.some((c) => c.playerId === p.id) && !p.archived), [players, f.order]);
  const [coins, setCoins] = useState("");
  const [items, setItems] = useState("");
  const [split, setSplit] = useState<"even" | "each">("even");
  const [who, setWho] = useState<string[]>(() => inFight.map((p) => p.id));
  const [each, setEach] = useState<Record<string, string>>({});
  const totalCp = parseAmount(coins) ?? 0;
  const evenShares = useMemo(() => {
    const n = who.length;
    if (!n || totalCp <= 0) return [] as { playerId: string; cp: number }[];
    const base = Math.floor(totalCp / n);
    let left = totalCp - base * n;
    return who.map((id) => ({ playerId: id, cp: base + (left-- > 0 ? 1 : 0) }));
  }, [who, totalCp]);
  const payouts = split === "even" ? evenShares : inFight.map((p) => ({ playerId: p.id, cp: parseAmount(each[p.id] ?? "") ?? 0 })).filter((x) => x.cp > 0);
  const lootCp = payouts.reduce((n, x) => n + x.cp, 0);
  const auto = chronicleLine(f, items, lootCp);
  const [note, setNote] = useState<string | null>(null);
  const text = note ?? auto;
  const [writeNote, setWriteNote] = useState(true);
  const [busy, setBusy] = useState(false);
  const rounds = f.round;
  const downed = f.downed.map((id) => f.order.find((c) => c.id === id)?.name).filter(Boolean);

  const finish = async (skip: boolean) => {
    setBusy(true);
    const ok = await run(
      skip ? { type: "fight.close", note: null } : { type: "fight.close", payouts, items, note: writeNote && text.trim() ? text.trim() : null },
      skip ? "Fight closed. The TV is back on the scene." : lootCp ? `Paid ${formatCp(lootCp)} in loot.` : "Fight closed. The TV is back on the scene.",
    );
    setBusy(false);
    if (ok) onDone();
  };

  return (
    <div className="fx-end">
      <section className="box">
        <h2>{f.outcome === "won" ? "Victory!" : f.outcome === "fallen" ? "The party has fallen" : "The fight is over"}</h2>
        <p>
          {rounds} round{rounds === 1 ? "" : "s"}. {downed.length ? `Went down: ${downed.join(", ")}.` : "Nobody went down."}
        </p>
        {f.outcome === "fallen" ? <p className="note">Everyone is at 0 HP, so the TV says the party has fallen. If they win after all, go back to the fight, heal someone and end it again.</p> : null}
        <p className="note">The TV is showing the end card. Finishing puts it back on the scene from before the fight.</p>
        <button className="btn small" type="button" onClick={() => run({ type: "fight.reopen" })}>
          ‹ Back to the fight
        </button>
      </section>

      <section className="box fx-loot" aria-label="Loot">
        <h3>Loot</h3>
        <div className="fx-add-row">
          <label className="fx-grow">
            Coins found
            <input className="fld" placeholder="e.g. 12 gp 5 sp" value={coins} onChange={(e) => setCoins(e.target.value)} disabled={split === "each"} />
          </label>
          <label>
            Split
            <select className="fld" value={split} onChange={(e) => setSplit(e.target.value as "even" | "each")}>
              <option value="even">Evenly</option>
              <option value="each">By player</option>
            </select>
          </label>
        </div>
        {split === "even" ? (
          <div className="fx-add-row">
            {inFight.map((p) => (
              <label key={p.id} className="check">
                <input type="checkbox" checked={who.includes(p.id)} onChange={(e) => setWho((xs) => (e.target.checked ? [...xs, p.id] : xs.filter((x) => x !== p.id)))} /> {p.character?.trim() || p.name}
                {evenShares.find((x) => x.playerId === p.id) ? <span className="note"> {formatCp(evenShares.find((x) => x.playerId === p.id)!.cp)}</span> : null}
              </label>
            ))}
          </div>
        ) : (
          <div className="fx-each">
            {inFight.map((p) => (
              <label key={p.id}>
                {p.character?.trim() || p.name}
                <input className="fld" placeholder="0 gp" value={each[p.id] ?? ""} onChange={(e) => setEach({ ...each, [p.id]: e.target.value })} />
              </label>
            ))}
          </div>
        )}
        {coins && split === "even" && parseAmount(coins) === null ? <p className="error-text">That amount didn&rsquo;t make sense. Try “12 gp” or “40 sp”.</p> : null}
        <label>
          Items (they add them in D&amp;D Beyond)
          <input className="fld" placeholder="a silver ladle, a scorched recipe card" value={items} maxLength={600} onChange={(e) => setItems(e.target.value)} />
        </label>
      </section>

      <section className="box fx-note" aria-label="Chronicle entry">
        <label className="check">
          <input type="checkbox" checked={writeNote} onChange={(e) => setWriteNote(e.target.checked)} /> Write it in the Chronicle
        </label>
        {writeNote ? <textarea className="fld" rows={3} value={text} maxLength={2000} onChange={(e) => setNote(e.target.value)} aria-label="Chronicle entry" /> : null}
        {note !== null && note !== auto ? (
          <button className="btn small" type="button" onClick={() => setNote(null)}>
            Use the suggested line
          </button>
        ) : null}
      </section>

      <div className="fx-end-btns">
        <button className="btn" type="button" disabled={busy} onClick={() => finish(true)}>
          Skip loot and Chronicle
        </button>
        <button className="btn primary" type="button" disabled={busy || (split === "even" && !!coins && parseAmount(coins) === null)} onClick={() => finish(false)}>
          {lootCp ? `Pay ${formatCp(lootCp)} and finish` : "Finish"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

/** An input that commits on blur or Enter and follows the server's value otherwise. */
function CommitInput({ value, onCommit, numeric, multiline, placeholder, label }: { value: string; onCommit: (v: string) => unknown; numeric?: boolean; multiline?: boolean; placeholder?: string; label?: string }) {
  const [v, setV] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setV(value);
  }, [value, focused]);
  const commit = async () => {
    setFocused(false);
    if (v === value) return;
    const r = await onCommit(v);
    if (r === false) setV(value);
  };
  if (multiline)
    return <textarea className="fld" rows={2} value={v} placeholder={placeholder} aria-label={label} onFocus={() => setFocused(true)} onBlur={commit} onChange={(e) => setV(e.target.value)} />;
  return (
    <input
      className={`fld${numeric ? " fx-num" : ""}`}
      inputMode={numeric ? "numeric" : undefined}
      value={v}
      placeholder={placeholder}
      aria-label={label}
      onFocus={() => setFocused(true)}
      onBlur={commit}
      onChange={(e) => setV(numeric ? e.target.value.replace(/[^\d-]/g, "").slice(0, 4) : e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setV(value);
          setTimeout(() => (e.target as HTMLInputElement).blur());
        }
      }}
    />
  );
}

