"use client";

import { useState } from "react";
import { featureOn } from "@/shared/features";
import { useDm } from "./context";

export type FirstStepPage = "players" | "monsters" | "episodes";

const hiddenKey = (game: string) => `cf-first-steps-hidden:${game}`;
const tvKey = (game: string) => `cf-first-steps-tv:${game}`;
const read = (k: string) => {
  try {
    return localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
};
const write = (k: string) => {
  try {
    localStorage.setItem(k, "1");
  } catch {
    /* private mode: it just shows again next time */
  }
};

/**
 * A short "here's how a first night goes" card for a campaign that has never
 * had a session. Each step ticks itself off from what's in the game, and it
 * goes away for good once session 1 starts (or the DM hides it).
 */
export function FirstSteps({ onGo, openTv }: { onGo: (page: FirstStepPage) => void; openTv: () => void }) {
  const { view, run, ident } = useDm();
  const s = view.state;
  const [hidden, setHidden] = useState(() => read(hiddenKey(ident.game)));
  const [tvDone, setTvDone] = useState(() => read(tvKey(ident.game)));
  if (hidden || s.practice || s.sessions.length || s.currentSessionId) return null;

  const seated = s.players.filter((p) => !p.archived);
  const seen = seated.filter((p) => p.lastSeenAt);
  const table = s.scenes.find((x) => x.kind === "table");
  const tvUp = tvDone || s.live.sceneId === table?.id;
  const combat = featureOn(s, "combat");
  const markTv = () => {
    write(tvKey(ident.game));
    setTvDone(true);
  };
  const steps = [
    {
      done: seen.length > 0,
      title: "Get your players in",
      text: (
        <>
          Players open this site and type the code <b className="fs-code">{ident.game}</b>, or you send each one their own link from Players.
          {seated.some((p) => !p.lastSeenAt && /^Player \d+$/.test(p.name)) ? " Player 1 to 4 are empty seats: rename them, or remove the ones you don’t need." : ""}
        </>
      ),
      action: (
        <button className="btn small" type="button" onClick={() => onGo("players")}>
          Players
        </button>
      ),
    },
    {
      done: tvUp,
      title: "Put the TV up",
      text: <>Open the TV view on the screen everyone can see. The Table shows a QR code players can scan to join.</>,
      action: (
        <span className="inline">
          <button className="btn small" type="button" onClick={() => (openTv(), markTv())}>
            Open the TV
          </button>
          {table ? (
            <button className="btn small" type="button" onClick={() => void run({ type: "scene.show", sceneId: table.id }, "The Table is on the TV, with the join code.").then((ok) => ok && markTv())}>
              Show The Table
            </button>
          ) : null}
        </span>
      ),
    },
    ...(combat
      ? [
          {
            done: (s.monsters ?? []).length > 0,
            title: "Have a fight ready",
            text: <>Add a few monsters (there are basic ones ready to go). Press Fight on one and the TV and phones ask for initiative.</>,
            action: (
              <button className="btn small" type="button" onClick={() => onGo("monsters")}>
                Monsters
              </button>
            ),
          },
        ]
      : []),
    {
      done: (s.episodes ?? []).length > 0,
      title: "Plan the night (optional)",
      text: <>Write the beats you want to hit. Run turns them into one screen at a time, with the read-aloud and what the TV shows.</>,
      action: (
        <button className="btn small" type="button" onClick={() => onGo("episodes")}>
          Episodes
        </button>
      ),
    },
    {
      done: false,
      title: "Start session 1",
      text: <>When everyone’s here, press Start session 1 at the top right. Gold, notes and fights from then on belong to that session.</>,
      action: null,
    },
  ];
  const left = steps.filter((x) => !x.done).length;

  return (
    <section className="first-steps" aria-label="First steps">
      <header className="fs-head">
        <div>
          <h2>Your first night</h2>
          <p className="note">{left === 1 ? "All set. Start when you’re ready." : `${steps.length - left} of ${steps.length} done. Each step ticks itself off.`}</p>
        </div>
        <button className="btn small" type="button" onClick={() => (write(hiddenKey(ident.game)), setHidden(true))}>
          Hide
        </button>
      </header>
      <ol className="fs-steps">
        {steps.map((x, i) => (
          <li key={x.title} className={x.done ? "done" : undefined}>
            <span className="fs-tick" aria-hidden="true">
              {x.done ? "✓" : i + 1}
            </span>
            <div className="fs-body">
              <b>{x.title}</b>
              {x.done ? <span className="sr-only"> (done)</span> : null}
              <span className="note">{x.text}</span>
            </div>
            {x.done ? null : x.action}
          </li>
        ))}
      </ol>
    </section>
  );
}
