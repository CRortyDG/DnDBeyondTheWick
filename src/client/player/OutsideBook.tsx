"use client";

// Out of the book: the page a player sees between games. The campaign is a book
// the DM is telling; this is its closed cover on the table, with everything out of
// character around it (the next game, getting your character and look ready, your
// party). "Open the book" goes into the app as it always was.

import { useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { NextGame } from "./NextGame";
import { DecisionBanners } from "./Requests";
import { PartyButton } from "./Party";
import type { Screen } from "./PlayerNav";

type Step = { id: string; label: string; done: boolean; go?: () => void; goLabel?: string };

/** "Two chapters written": the told ones, not the page waiting for the next session. */
function chaptersText(view: PlayerView): string | null {
  const told = view.chronicle.chapters.filter((c) => c.kind !== "world" && (c.endedAt !== null || c.running)).length;
  if (!told) return null;
  const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  return `${words[told] ?? told} chapter${told === 1 ? "" : "s"} written`;
}

function worldText(view: PlayerView): string | null {
  const w = view.world;
  if (!w) return null;
  const bits: string[] = [];
  if (w.date) {
    const [y, m, d] = w.date.split("-").map(Number);
    bits.push(new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }));
  }
  if (w.now.length) bits.push(w.now.map((e) => e.name).join(", "));
  else if (w.next) bits.push(w.next.inDays === 1 ? `${w.next.name} tomorrow` : `${w.next.name} in ${w.next.inDays} days`);
  return bits.length ? bits.join(" · ") : null;
}

const WELCOME_KEY = (gameId: string, playerId: string) => `cf-welcome:${gameId}:${playerId}`;

export function OutsideBook({
  view,
  onOpen,
  onYou,
  onLook,
  onLock,
  sheetsOn,
}: {
  view: PlayerView;
  /** Open the book, at a tab if one is named. */
  onOpen: (at?: Screen) => void;
  /** "Your character" sheet: D&D Beyond link, name lock, sound, whispers. */
  onYou: () => void;
  onLook: () => void;
  onLock: () => void;
  sheetsOn: boolean;
}) {
  const me = view.me;
  const name = me.character ?? me.name;
  const chapters = chaptersText(view);
  const when = worldText(view);
  const unread = (view.whispers ?? []).filter((w) => !w.seen).length;

  // A new player's first steps. Each ticks itself off; "Hide" puts the card away for good.
  const steps: Step[] = [
    ...(sheetsOn ? [{ id: "sheet", label: "Make your character", done: !!me.sheet, go: () => onOpen("sheet"), goLabel: "Start" }] : []),
    { id: "look", label: "Make your look", done: !!me.look, go: onLook, goLabel: "Start" },
    { id: "lock", label: "Lock your name, so only you can open it", done: me.locked, go: onLock, goLabel: "Lock" },
  ];
  const key = WELCOME_KEY(view.game.id, me.id);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  const hide = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {}
    setHidden(true);
  };
  const showSteps = !hidden && steps.some((s) => !s.done);
  const newcomer = !me.sheet && !me.look;

  return (
    <div className="ob">
      <header className="ob-top">
        <button type="button" className="ob-who" aria-haspopup="dialog" onClick={onYou} aria-label={`${name}: your character, D&D Beyond link, name lock and sound`}>
          <span className="ob-name">{name}</span>
          <span className="ob-sub">{me.character ? `Played by ${me.name}` : "Player"}</span>
        </button>
      </header>

      <DecisionBanners view={view} />

      {showSteps ? (
        <section className="ob-card ob-welcome" aria-labelledby="ob-welcome-title">
          <h2 id="ob-welcome-title">{newcomer ? `You’re in, ${me.name}` : "Before the next game"}</h2>
          <p className="ob-note">{newcomer ? `Welcome to ${view.game.name}. A few things while you wait for the DM. The book fills in as you play.` : "A couple of things left to do."}</p>
          <ul className="ob-steps">
            {steps.map((s) => (
              <li key={s.id} className={s.done ? "done" : undefined}>
                <span className="ob-check" aria-hidden="true">
                  {s.done ? "✓" : ""}
                </span>
                <span className="ob-step-label">
                  {s.label}
                  {s.done ? <span className="sr-only"> (done)</span> : null}
                </span>
                {!s.done && s.go ? (
                  <button type="button" className={`btn small${s.id === steps.find((x) => !x.done)?.id ? " primary" : ""}`} onClick={s.go}>
                    {s.goLabel}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <button type="button" className="linkish ob-hide" onClick={hide}>
            Hide this
          </button>
        </section>
      ) : null}

      <section className="ob-book" aria-label={view.game.name}>
        <button type="button" className="ob-cover" onClick={() => onOpen()} aria-label={`Open the book: ${view.game.name}`}>
          {view.game.bookLine ? <span className="ob-cover-line">{view.game.bookLine}</span> : null}
          <span className="ob-cover-title">{view.game.name}</span>
          <span className="ob-cover-orn" aria-hidden="true">
            ❦
          </span>
          {chapters ? <span className="ob-cover-line">{chapters}</span> : <span className="ob-cover-line">The first page is waiting</span>}
          {when ? <span className="ob-cover-line">{when}</span> : null}
          <span className="ob-ribbon" aria-hidden="true" />
        </button>
        <button type="button" className="btn primary big ob-open" onClick={() => onOpen()}>
          Open the book
        </button>
      </section>

      {unread ? (
        <button type="button" className="ob-nudge sealed" onClick={() => onOpen("chronicle")}>
          <span className="ob-dot" aria-hidden="true" />
          <span>{unread > 1 ? `${unread} whispers from the DM` : "A whisper from the DM"}</span>
          <span className="ob-go">Read</span>
        </button>
      ) : null}
      {view.lastTime ? (
        <button type="button" className="ob-nudge" onClick={() => onOpen("chronicle")}>
          <span className="ob-dot gold" aria-hidden="true" />
          <span>Last time on&hellip; Chapter {view.lastTime.chapter}</span>
          <span className="ob-go">Read</span>
        </button>
      ) : null}

      <NextGame view={view} />

      <section className="ob-card" aria-labelledby="ob-you-title">
        <h2 id="ob-you-title" className="ob-k">
          Your character
        </h2>
        <ul className="ob-rows">
          {sheetsOn ? (
            <li>
              <button type="button" onClick={() => onOpen("sheet")}>
                <span>{me.sheet ? [name, me.level ? `Level ${me.level}` : null].filter(Boolean).join(" · ") : "Your character sheet"}</span>
                <span className="ob-go">{me.sheet ? "›" : "Make it ›"}</span>
              </button>
            </li>
          ) : null}
          <li>
            <button type="button" onClick={onLook}>
              <span>Your look</span>
              <span className="ob-go">{me.look ? "›" : "Make it ›"}</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={onYou}>
              <span>D&amp;D Beyond, name lock and sound</span>
              <span className="ob-go">›</span>
            </button>
          </li>
        </ul>
        <PartyButton view={view} className="btn ob-party" />
      </section>
    </div>
  );
}
