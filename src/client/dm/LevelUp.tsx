"use client";

// "Level up the party": each character at the table goes up one (change any of
// them first), then the TV plays "Level 3!", the Chronicle gets a line and
// every phone shows its new level. No XP.
import { useState } from "react";
import { characterName, LEVEL_MAX, suggestedLevels } from "@/shared/levels";
import { useDm } from "./context";

export function LevelUpButton({ small }: { small?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={`btn${small ? " small" : ""}`} type="button" onClick={() => setOpen(true)} title="Level up the party: a moment on the TV, a Chronicle line, and new levels on the phones">
        <span aria-hidden="true">▲</span> Level up
      </button>
      {open ? <LevelUpDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function LevelUpDialog({ onClose }: { onClose: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const start = suggestedLevels(s);
  // A campaign that never set levels: ask where they are now instead of guessing.
  const unset = start.length > 0 && start.every((x) => x.from === null);
  const [now, setNow] = useState("1");
  const [levels, setLevels] = useState<Record<string, number>>(() => Object.fromEntries(start.map((x) => [x.playerId, x.level])));
  const [tv, setTv] = useState(true);
  const base = Math.max(1, Math.min(LEVEL_MAX - 1, Math.round(Number(now)) || 1));
  const levelOf = (id: string) => (unset && levels[id] === start.find((x) => x.playerId === id)?.level ? base + 1 : levels[id]);
  const name = (id: string) => {
    const p = s.players.find((x) => x.id === id);
    return p ? characterName(p) : "?";
  };
  const go = async () => {
    const list = start.map((x) => ({ playerId: x.playerId, level: Math.max(1, Math.min(LEVEL_MAX, levelOf(x.playerId))) }));
    const same = list.every((l) => l.level === list[0].level);
    if (await run({ type: "party.levelUp", levels: list, tv }, same ? `Level ${list[0].level}!` : "Levelled up.")) onClose();
  };
  return (
    <div className="inbox-backdrop" onClick={onClose}>
      <aside className="inbox-drawer wrapup level-up" role="dialog" aria-label="Level up the party" onClick={(e) => e.stopPropagation()}>
        <div className="box-head">
          <h2>Level up the party</h2>
          <button type="button" className="btn small" onClick={onClose}>
            Not yet
          </button>
        </div>
        {!start.length ? (
          <p className="note">Nobody is at the table. Mark players as back tonight on the Players page first.</p>
        ) : (
          <>
            {unset ? (
              <label className="level-now">
                What level are they now?
                <input className="fld" inputMode="numeric" value={now} onChange={(e) => setNow(e.target.value.replace(/\D/g, "").slice(0, 2))} aria-label="Their level now" />
                <span className="note">Everyone goes up to level {base + 1}. You can change anyone below.</span>
              </label>
            ) : (
              <p className="note">Everyone at the table goes up one. Change anyone who levels differently.</p>
            )}
            <ul className="level-list">
              {start.map((x) => (
                <li key={x.playerId}>
                  <span className="level-name">{name(x.playerId)}</span>
                  <span className="note">{x.from ? `level ${x.from} →` : "→"}</span>
                  <input
                    className="fld level-num"
                    type="number"
                    min={1}
                    max={LEVEL_MAX}
                    value={levelOf(x.playerId)}
                    aria-label={`New level for ${name(x.playerId)}`}
                    onChange={(e) => setLevels((m) => ({ ...m, [x.playerId]: Math.max(1, Math.min(LEVEL_MAX, Math.round(Number(e.target.value)) || 1)) }))}
                  />
                </li>
              ))}
            </ul>
            <label className="check">
              <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} /> Play the moment on the TV
            </label>
            <button type="button" className="btn primary" onClick={() => void go()}>
              Level up
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
