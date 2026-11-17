"use client";

import type { ReactNode } from "react";
import type { PlayerView } from "@/shared/projection";
import { STARTERS } from "@/shared/starters";
import { CharacterSheetView } from "../ui/CharacterSheet";
import { MyHp } from "./FightCard";

export type CharacterPart = "sheet" | "gold";

/**
 * The Character tab: the sheet, and gold and shops beside it. A player who
 * uses D&D Beyond keeps their link and can ignore the sheet entirely.
 */
export function CharacterTab({
  view,
  send,
  part,
  onPart,
  gold,
  onLink,
}: {
  view: PlayerView;
  send: (c: object) => Promise<string | null>;
  part: CharacterPart;
  onPart: (p: CharacterPart) => void;
  /** The Gold and shops page as it was. null: gold is turned off, so the tab is just the sheet. */
  gold: ReactNode | null;
  /** Open "Your character" (the D&D Beyond link). */
  onLink: () => void;
}) {
  const me = view.me;
  // The DM turned the sheet off for this player: just gold and shops, as before.
  if (me.sheetOff) return <>{gold}</>;
  return (
    <>
      {gold === null ? null : (
      <div className="pl-seg pl-char-seg" role="tablist" aria-label="Your character">
        <button type="button" role="tab" aria-selected={part === "sheet"} className={part === "sheet" ? "on" : undefined} onClick={() => onPart("sheet")}>
          Sheet
        </button>
        <button type="button" role="tab" aria-selected={part === "gold"} className={part === "gold" ? "on" : undefined} onClick={() => onPart("gold")}>
          Gold &amp; shops
        </button>
      </div>
      )}
      {part === "gold" && gold !== null ? (
        gold
      ) : me.sheet ? (
        <section className="pl-sheet" aria-label="Character sheet">
          <CharacterSheetView
            sheet={me.sheet}
            level={me.level}
            inspired={view.purse.find((p) => p.id === me.id)?.inspired}
            lockedOut={!!me.sheet.locked}
            onPatch={(patch) => send({ type: "me.sheet", patch })}
            hp={<MyHp hp={me.hp} hasSheet go={async (c) => !(await send(c))} />}
          />
          {me.dndbUrl ? (
            <a className="btn" href={me.dndbUrl} target="_blank" rel="noopener noreferrer">
              Open D&amp;D Beyond too
            </a>
          ) : null}
        </section>
      ) : (
        <StartSheet view={view} send={send} onLink={onLink} />
      )}
    </>
  );
}

function StartSheet({ view, send, onLink }: { view: PlayerView; send: (c: object) => Promise<string | null>; onLink: () => void }) {
  const me = view.me;
  const starter = STARTERS.find((s) => s.id === me.starter);
  return (
    <section className="box cs-start">
      <h2>Your character sheet</h2>
      <p>Keep your character right here: scores, skills, AC and HP, with the math done for you. Your DM sees it too, so nobody has to ask your AC mid-fight.</p>
      {starter ? (
        <button type="button" className="btn primary big" onClick={() => void send({ type: "me.sheet", patch: {}, starter: true })}>
          Start from {starter.title} ({starter.dnd.species} {starter.dnd.cls})
        </button>
      ) : null}
      <button type="button" className={`btn big${starter ? "" : " primary"}`} onClick={() => void send({ type: "me.sheet", patch: {} })}>
        Start a blank sheet
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
