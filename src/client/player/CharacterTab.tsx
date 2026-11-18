"use client";

import { useEffect, useRef, useState } from "react";
import { describeResult, natural } from "@/shared/dice";
import type { SheetRoll } from "@/shared/sheet";
import type { PlayerView } from "@/shared/projection";
import { STARTERS } from "@/shared/starters";
import { CharacterSheetView } from "../ui/CharacterSheet";
import { LevelUpCard, SheetBuilder } from "../ui/SheetBuilder";
import { MyHp } from "./FightCard";
import { KeepsakeShelf } from "./Keepsakes";

/**
 * The Character tab: the sheet. Gold and shops have their own tab. A player who
 * uses D&D Beyond keeps their link and can ignore the sheet entirely.
 */
export function CharacterTab({
  view,
  send,
  onLink,
}: {
  view: PlayerView;
  send: (c: object) => Promise<string | null>;
  /** Open "Your character" (the D&D Beyond link). */
  onLink: () => void;
}) {
  const me = view.me;
  const [adv, setAdv] = useState<"" | "adv" | "dis">("");
  const [tv, setTv] = useState(true);
  const [rollErr, setRollErr] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const roll = async (r: SheetRoll) => {
    const err = await send({
      type: "me.sheetRoll",
      roll: r,
      ...(adv && (r.kind !== "attack" || r.part === "hit") ? { adv } : {}),
      tv,
    });
    setRollErr(err);
    // Advantage is for one roll: back to normal after it.
    if (!err) setAdv("");
  };
  if (building) return <SheetBuilder level={me.level} starter={me.starter} replacing={!!me.sheet} send={send} onClose={() => setBuilding(false)} />;
  return (
    <>
      {me.sheet ? (
        <section className="pl-sheet" aria-label="Character sheet">
          <LevelUpCard sheet={me.sheet} level={me.level} send={send} />
          <CharacterSheetView
            sheet={me.sheet}
            level={me.level}
            inspired={view.purse.find((p) => p.id === me.id)?.inspired}
            lockedOut={!!me.sheet.locked}
            onPatch={(patch) => send({ type: "me.sheet", patch })}
            onAct={(act) => send({ type: "me.sheetAct", act })}
            onHitDie={() => send({ type: "me.hitDie", tv })}
            giveTo={view.purse.filter((x) => x.sheet && x.id !== me.id).map((x) => ({ id: x.id, name: x.name }))}
            onGive={(itemId, toPlayerId, qty) => send({ type: "me.giveItem", itemId, toPlayerId, qty })}
            onRoll={roll}
            rollBar={
              <>
                <div className="cs-rollwrap">
                  <div className="cs-rollbar">
                    <div className="pl-seg" role="group" aria-label="Advantage">
                      {(["dis", "", "adv"] as const).map((m) => (
                        <button key={m || "normal"} type="button" className={adv === m ? "on" : undefined} aria-pressed={adv === m} onClick={() => setAdv(m)}>
                          {m === "adv" ? "Advantage" : m === "dis" ? "Disadv." : "Normal"}
                        </button>
                      ))}
                    </div>
                    <label className="check">
                      <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} /> On TV
                    </label>
                  </div>
                  {rollErr ? (
                    <p className="cs-err" role="alert">
                      {rollErr}
                    </p>
                  ) : null}
                  <LastRoll view={view} />
                </div>
                <p className="cs-rollbar-hint">
                  Tap any score, save, skill, initiative or attack to roll it. Tap a spell to cast or roll it
                  {tv ? " on the TV" : " for the DM only"}.
                </p>
              </>
            }
            hp={<MyHp hp={me.hp} hasSheet go={async (c) => !(await send(c))} />}
          />
          {me.dndbUrl ? (
            <a className="btn" href={me.dndbUrl} target="_blank" rel="noopener noreferrer">
              Open D&amp;D Beyond too
            </a>
          ) : null}
          {!me.sheet.locked ? (
            <button type="button" className="btn" onClick={() => setBuilding(true)}>
              Start again with the character builder
            </button>
          ) : null}
        </section>
      ) : (
        <StartSheet view={view} send={send} onLink={onLink} onBuild={() => setBuilding(true)} />
      )}
      <KeepsakeShelf view={view} />
    </>
  );
}

/** My newest roll from the sheet, big, for a few seconds after it lands. */
function LastRoll({ view }: { view: PlayerView }) {
  const r = view.myRolls[0];
  const first = useRef(r?.n);
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!r || r.n === first.current || !r.label) return;
    setShown(r.n);
    const t = setTimeout(() => setShown(null), 8000);
    return () => clearTimeout(t);
  }, [r?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r || shown !== r.n) return null;
  const nat = natural(r);
  return (
    <div className={`cs-last${nat === 20 ? " crit" : nat === 1 ? " fumble" : ""}`} role="status">
      <b>{r.total}</b>
      <span>
        {r.label}: {describeResult(r)} ({r.groups.flatMap((g) => g.rolls).join(", ")}){nat === 20 ? " · Natural 20!" : nat === 1 ? " · Natural 1" : ""}
        {r.to === "tv" ? " · on the TV" : " · DM only"}
      </span>
    </div>
  );
}

function StartSheet({ view, send, onLink, onBuild }: { view: PlayerView; send: (c: object) => Promise<string | null>; onLink: () => void; onBuild: () => void }) {
  const me = view.me;
  const starter = STARTERS.find((s) => s.id === me.starter);
  return (
    <section className="box cs-start">
      <h2>Your character sheet</h2>
      <p>Keep your character right here: scores, skills, AC and HP, with the math done for you. Your DM sees it too, so nobody has to ask your AC mid-fight.</p>
      <button type="button" className="btn primary big" onClick={onBuild}>
        {starter ? `Make my character (${starter.title} or your own)` : "Make my character"}
      </button>
      <p className="note">A ready-made hero in one tap, or step by step: class, species, background, scores, skills, kit and spells.</p>
      <button type="button" className="btn big" onClick={() => void send({ type: "me.sheet", patch: {} })}>
        I&rsquo;ll fill in a blank sheet myself
      </button>
      {me.dndbUrl ? (
        <>
          <p className="note">Or keep using D&amp;D Beyond. Nothing changes if you do.</p>
          <a className="btn big" href={me.dndbUrl} target="_blank" rel="noopener noreferrer">
            Open D&amp;D Beyond
          </a>
        </>
      ) : (
        <button type="button" className="btn big" onClick={onLink}>
          I use D&amp;D Beyond
        </button>
      )}
    </section>
  );
}
