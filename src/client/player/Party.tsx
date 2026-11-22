"use client";

// The party page: who's at the table, with each character's portrait, class
// and level. What the table already knows, never gold, HP or sheet details.

import { useState } from "react";
import type { PartyMember, PlayerView } from "@/shared/projection";
import { PixelLook } from "../ui/PixelLook";
import { Sheet } from "./Sheet";

export function partyLine(m: Pick<PartyMember, "level" | "cls" | "subclass" | "species">): string {
  const cls = m.cls ? `${m.cls}${m.subclass ? ` (${m.subclass})` : ""}` : "";
  const lead = m.level ? `Level ${m.level}${cls ? ` ${cls}` : ""}` : cls;
  return [lead, m.species].filter(Boolean).join(" · ");
}

export function PartySheet({ view, onClose }: { view: PlayerView; onClose: () => void }) {
  const party = view.party ?? [];
  return (
    <Sheet title="Your party" onClose={onClose} className="pl-party-sheet">
      <ul className="pl-party" aria-label="Your party">
        {party.map((m) => {
          const line = partyLine(m);
          return (
            <li key={m.id} className={`pl-party-row${m.you ? " you" : ""}${m.away ? " away" : ""}`}>
              <span className="pl-party-face" aria-hidden="true">
                {m.look ? <PixelLook look={m.look} face own={m.you} /> : <span className="pl-party-initial">{(m.name.trim()[0] ?? "?").toUpperCase()}</span>}
              </span>
              <span className="pl-party-text">
                <span className="pl-party-name">
                  {m.name}
                  {m.you ? <span className="pl-party-tag">You</span> : null}
                  {m.away ? <span className="pl-party-tag away">Away tonight</span> : null}
                </span>
                {line ? <span className="pl-party-line">{line}</span> : <span className="pl-party-line none">Class not set yet</span>}
                {m.player ? <span className="pl-party-player">Played by {m.player}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
      {party.length < 2 ? <p className="note">Nobody else has joined yet. They show up here once they do.</p> : null}
    </Sheet>
  );
}

/**
 * A button for "Your character" (and the computer's side bar) that opens the party page.
 * Pass onOpen to show the page from higher up instead: a sheet drawn inside a sticky or
 * fixed box is trapped in that box's layer, and later layers paint over it.
 */
export function PartyButton({ view, className = "btn big", onOpen }: { view: PlayerView; className?: string; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const count = (view.party ?? []).length;
  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" onClick={() => (onOpen ? onOpen() : setOpen(true))}>
        Your party{count > 1 ? ` (${count})` : ""}
      </button>
      {open ? <PartySheet view={view} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
