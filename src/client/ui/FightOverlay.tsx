"use client";

// Combat mode on the TV: turn order across the top, a big "now" panel, "up
// next", the round, an optional hourglass, and short animations for big
// moments. It sits over the live scene's art, dimmed. Everything here comes
// from the filtered fight view: no monster numbers, real names or hidden foes.

import { useEffect, useMemo, useRef, useState } from "react";
import { HEALTH_LABEL, type FightView, type PublicCombatant } from "@/shared/combat";
import { artSrc } from "./SceneView";
import "./fight.css";

export function FightOverlay({ fight, preview = false }: { fight: FightView; preview?: boolean }) {
  if (fight.status === "paused") {
    return (
      <div className="fv-paused" role="status">
        Fight paused &middot; Round {fight.round}
      </div>
    );
  }
  return (
    <div className={`fv-root${preview ? " preview" : ""}`} role="region" aria-label="The fight">
      {fight.status === "setup" ? <RollInitiative fight={fight} /> : null}
      {fight.status === "running" ? <Turns fight={fight} /> : null}
      {fight.status === "over" ? <Over fight={fight} /> : null}
      {!preview ? <Moment fight={fight} /> : null}
    </div>
  );
}

function RollInitiative({ fight }: { fight: FightView }) {
  const players = fight.order.filter((c) => c.kind === "player");
  const ready = players.filter((c) => c.ready).length;
  return (
    <div className="fv-roll">
      <div className="fv-roll-card">
        <div className="fv-kicker">A fight breaks out</div>
        <h2 className="fv-roll-title">Roll initiative!</h2>
        <p className="fv-roll-sub">Roll a d20, add your initiative, and type the total on your phone.</p>
        {players.length ? (
          <ul className="fv-roll-list">
            {players.map((c) => (
              <li key={c.id} className={c.ready ? "ready" : ""}>
                <Badge c={c} size="sm" />
                <span>{c.name}</span>
                <span className="fv-roll-mark" aria-label={c.ready ? "ready" : "waiting"}>
                  {c.ready ? "✓" : "…"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {players.length ? (
          <div className="fv-roll-count">
            {ready} of {players.length} ready
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Turns({ fight }: { fight: FightView }) {
  const now = fight.order.find((c) => c.id === fight.currentId) ?? null;
  const next = fight.order.find((c) => c.id === fight.nextId) ?? null;
  return (
    <>
      <ol className="fv-strip" aria-label="Turn order">
        {fight.order.map((c) => (
          <li key={c.id} className={`fv-chip${c.id === fight.currentId ? " cur" : ""}${c.id === fight.nextId ? " next" : ""}${c.down ? " down" : ""}`}>
            <Badge c={c} size="sm" />
            <span className="fv-chip-name">{c.name}</span>
            <Health c={c} small />
          </li>
        ))}
      </ol>
      <div className="fv-round" aria-label={`Round ${fight.round}`}>
        <span>Round</span>
        <b>{fight.round}</b>
      </div>
      <div className="fv-stage">
        <section className={`fv-now${now?.down ? " down" : ""}`} aria-live="polite" aria-label="Whose turn">
          {now ? (
            <>
              <div className="fv-kicker">Now</div>
              <Badge c={now} size="lg" />
              <h2 className="fv-now-name">{now.name}</h2>
              <Health c={now} />
              {now.concentrating ? <div className="fv-conc">Concentrating</div> : null}
              {now.conditions.length ? (
                <ul className="fv-conds">
                  {now.conditions.map((k, i) => (
                    <li key={i}>
                      <CondIcon name={k.name} />
                      <span>
                        {k.name}
                        {k.level ? ` ${k.level}` : ""}
                      </span>
                      {k.rounds !== undefined ? <span className="fv-cond-n">{k.rounds}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {now.down && now.deathSaves ? <Saves c={now} /> : null}
            </>
          ) : (
            <>
              <div className="fv-kicker">Now</div>
              <div className="fv-unknown" aria-label="Someone unseen">
                <i />
                <i />
                <i />
              </div>
            </>
          )}
        </section>
        {next ? (
          <section className="fv-next" aria-label="Up next">
            <div className="fv-kicker">Up next</div>
            <Badge c={next} size="md" />
            <div className="fv-next-name">{next.name}</div>
          </section>
        ) : null}
      </div>
      {fight.timer ? <Hourglass timer={fight.timer} turnKey={`${fight.round}:${fight.currentId}`} /> : null}
      <DownSaves fight={fight} />
    </>
  );
}

/** Players at 0 HP whose turn it isn't: their saves stay visible in the corner. */
function DownSaves({ fight }: { fight: FightView }) {
  const down = fight.order.filter((c) => c.kind === "player" && c.down && c.deathSaves && c.id !== fight.currentId);
  if (!down.length) return null;
  return (
    <ul className="fv-downlist" aria-label="Down">
      {down.map((c) => (
        <li key={c.id}>
          <b>{c.name}</b> is down <Saves c={c} />
        </li>
      ))}
    </ul>
  );
}

function Saves({ c }: { c: PublicCombatant }) {
  const ds = c.deathSaves ?? { ok: 0, fail: 0 };
  return (
    <span className="fv-saves" aria-label={`Death saves: ${ds.ok} of 3 successes, ${ds.fail} of 3 failures`}>
      <span className="fv-saves-row ok">
        {[0, 1, 2].map((i) => (
          <i key={i} className={i < ds.ok ? "on" : ""} />
        ))}
      </span>
      <span className="fv-saves-row fail">
        {[0, 1, 2].map((i) => (
          <i key={i} className={i < ds.fail ? "on" : ""} />
        ))}
      </span>
    </span>
  );
}

function Health({ c, small }: { c: PublicCombatant; small?: boolean }) {
  if (c.kind === "monster" && c.health) return <span className={`fv-health ${c.health}${small ? " small" : ""}`}>{HEALTH_LABEL[c.health]}</span>;
  if (c.hp) {
    const pct = Math.max(0, Math.min(100, (c.hp.cur / Math.max(1, c.hp.max)) * 100));
    return (
      <span className={`fv-hpbar${small ? " small" : ""}${c.down ? " down" : ""}`} aria-label={`${c.hp.cur} of ${c.hp.max} HP`}>
        <span className="fv-hpbar-fill" style={{ width: `${pct}%` }} />
        {c.hp.temp ? <span className="fv-hpbar-temp" /> : null}
        {!small ? (
          <span className="fv-hpbar-num">
            {c.hp.cur} / {c.hp.max}
            {c.hp.temp ? ` +${c.hp.temp}` : ""}
          </span>
        ) : null}
      </span>
    );
  }
  if (c.down) return <span className={`fv-health down${small ? " small" : ""}`}>Down</span>;
  return null;
}

/** A portrait, or a seal: a player's initial, or a claw mark for a monster. */
function Badge({ c, size }: { c: PublicCombatant; size: "sm" | "md" | "lg" }) {
  const src = c.art ? artSrc(c.art) : undefined;
  if (src) return <img className={`fv-badge ${size}`} src={src} alt="" />;
  if (c.kind === "player") {
    return (
      <span className={`fv-badge ${size} player`} aria-hidden="true">
        {c.name.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }
  return (
    <span className={`fv-badge ${size} monster`} aria-hidden="true">
      <svg viewBox="0 0 40 40" width="62%" height="62%">
        <path d="M9 31 C13 22 15 15 14 7 M18 33 C22 23 23 15 21 6 M27 32 C30 24 31 17 29 9" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

const COND_GLYPH: Record<string, string> = {
  Blinded: "◉",
  Charmed: "♥",
  Deafened: "◌",
  Exhaustion: "☾",
  Frightened: "!",
  Grappled: "✊",
  Incapacitated: "✕",
  Invisible: "◇",
  Paralyzed: "≋",
  Petrified: "▲",
  Poisoned: "☠",
  Prone: "▁",
  Restrained: "⛓",
  Stunned: "✶",
  Unconscious: "z",
};

function CondIcon({ name }: { name: string }) {
  return (
    <span className="fv-cond-icon" aria-hidden="true">
      {COND_GLYPH[name] ?? name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Sand drains over the turn; when it runs out it just glows. Nothing is skipped. */
function Hourglass({ timer, turnKey }: { timer: NonNullable<FightView["timer"]>; turnKey: string }) {
  // The server's clock, as of when this view was sent.
  const offset = useMemo(() => timer.clock - Date.now(), [timer.clock]);
  const [nowMs, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (timer.pausedAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer.pausedAt, turnKey]);
  const serverNow = timer.pausedAt ?? nowMs + offset;
  const left = Math.max(0, timer.sec - (serverNow - timer.startedAt) / 1000);
  const frac = Math.max(0, Math.min(1, left / timer.sec));
  const out = left <= 0;
  const topH = 34 * frac;
  const botH = 34 * (1 - frac);
  return (
    <div className={`fv-glass${out ? " out" : ""}`} aria-label={out ? "Time's up" : `${Math.ceil(left)} seconds left`}>
      <svg viewBox="0 0 60 90" width="100%" height="100%">
        <defs>
          <clipPath id="fv-glass-top">
            <path d="M8 6 H52 C52 26 34 36 31 45 H29 C26 36 8 26 8 6 Z" />
          </clipPath>
          <clipPath id="fv-glass-bot">
            <path d="M29 45 H31 C34 54 52 64 52 84 H8 C8 64 26 54 29 45 Z" />
          </clipPath>
        </defs>
        <rect className="fv-sand" x="0" y={45 - topH} width="60" height={topH} clipPath="url(#fv-glass-top)" />
        <rect className="fv-sand" x="0" y={84 - botH} width="60" height={botH} clipPath="url(#fv-glass-bot)" />
        {!out ? <rect className="fv-sand fv-stream" x="29.2" y="45" width="1.6" height="39" /> : null}
        <path className="fv-glass-frame" d="M8 6 H52 C52 26 34 36 31 45 C34 54 52 64 52 84 H8 C8 64 26 54 29 45 C26 36 8 26 8 6 Z" fill="none" />
        <rect className="fv-glass-cap" x="4" y="2" width="52" height="5" rx="2" />
        <rect className="fv-glass-cap" x="4" y="83" width="52" height="5" rx="2" />
      </svg>
    </div>
  );
}

function Over({ fight }: { fight: FightView }) {
  const o = fight.over ?? { rounds: fight.round, downed: [] };
  return (
    <div className="fv-roll">
      <div className="fv-roll-card fv-over">
        <div className="fv-kicker">Steel is sheathed</div>
        <h2 className="fv-roll-title">The fight is over</h2>
        <p className="fv-roll-sub">
          {o.rounds} round{o.rounds === 1 ? "" : "s"}
        </p>
        {o.downed.length ? <p className="fv-over-down">Went down: {o.downed.join(", ")}</p> : <p className="fv-over-down">Nobody went down.</p>}
      </div>
    </div>
  );
}

/** A crit, a monster falling, a player at 0 HP, the fight ending: a short flourish when moment.n changes. */
function Moment({ fight }: { fight: FightView }) {
  const n = fight.moment?.n;
  const seen = useRef(n);
  const [show, setShow] = useState<FightView["moment"] | null>(null);
  useEffect(() => {
    if (n === undefined || n === seen.current) return;
    seen.current = n;
    setShow(fight.moment ?? null);
    const t = setTimeout(() => setShow(null), fight.moment?.kind === "end" ? 2600 : 2200);
    return () => clearTimeout(t);
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!show) return null;
  const text = show.kind === "crit" ? "Critical hit!" : show.kind === "monsterDown" ? `${show.name} falls!` : show.kind === "playerDown" ? `${show.name} is down!` : "Victory";
  return (
    <div key={show.n} className={`fv-moment ${show.kind}`} role="status" aria-live="assertive">
      <div className="fv-moment-burst" aria-hidden="true" />
      <div className="fv-moment-text">{text}</div>
      {show.kind === "crit" && show.name ? <div className="fv-moment-sub">on {show.name}</div> : null}
    </div>
  );
}
