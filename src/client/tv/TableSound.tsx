"use client";

// The TV's sound: plays the DM's soundboard, and the sounds that moments bring
// with them (dice, fights, scenes, rank-ups, the Table filling up). Browsers
// won't play sound until someone clicks or presses a key on the page, so when
// sound is wanted but blocked, a small "Click for sound" note shows.

import { useEffect, useRef, useState } from "react";
import type { TvView } from "@/shared/projection";
import { natural } from "@/shared/dice";
import { duckFor, STINGER_CUES, stingerBed, tableMix } from "../sound/tableMix";
import { SpeakerIcon } from "../ui/icons";
import { setAutoCues, tableEngine, useSoundPref, writeSoundPref } from "../ui/tvSound";

/** Matches DiceRoll.tsx: when the dice land. */
const TUMBLE_MS = 1400;
const STAGGER_MS = 90;

export function TableSound({ view }: { view: TvView }) {
  const pref = useSoundPref();
  // A TV shown inside another page (the DM's practice preview) stays quiet.
  const framed = typeof window !== "undefined" && window.self !== window.top;
  const [running, setRunning] = useState(false);
  const [dmUsed, setDmUsed] = useState(false);
  const snd = view.sound;
  const allowed = !framed && pref !== "off";
  const engine = allowed && (pref === "on" || dmUsed) ? tableEngine() : null;

  // The DM reached for the soundboard while this TV was open: sound is wanted.
  const firstCue = useRef(snd.cue?.n);
  useEffect(() => {
    if (Object.keys(snd.layers).length || (snd.cue && snd.cue.n !== firstCue.current)) setDmUsed(true);
  }, [snd.layers, snd.cue]);

  // Any click or key on the TV lets the page make sound.
  useEffect(() => {
    if (!engine) return;
    const wake = () => {
      void engine.unlock().then(() => {
        setRunning(engine.running);
        if (engine.running && readPrefNow() !== "on") writeSoundPref("on");
      });
    };
    const poll = setInterval(() => setRunning(engine.running), 1000);
    setRunning(engine.running);
    // It may be allowed already (a site the browser trusts).
    void engine.unlock().then(() => setRunning(engine.running));
    // iPhones only count touchend/click as "the user meant it", not pointerdown.
    const evs = ["pointerdown", "touchend", "click", "keydown"] as const;
    for (const ev of evs) window.addEventListener(ev, wake);
    return () => {
      clearInterval(poll);
      for (const ev of evs) window.removeEventListener(ev, wake);
    };
  }, [engine]);

  useEffect(() => setAutoCues(snd.auto), [snd.auto]);
  useEffect(() => engine?.setMaster(snd.volume, snd.muted), [engine, snd.volume, snd.muted]);

  // ---- What's on the TV
  const amb = view.live.ambient;
  const live = view.scenes.find((s) => s.id === view.live.sceneId);
  const kind = amb ? "ambient" : live?.kind;
  const lit = view.table?.seats.filter((s) => s.lit).length ?? 0;
  const seats = view.table ? { lit, total: view.table.seats.length } : undefined;
  const fighting = !!view.fight && (view.fight.status === "setup" || view.fight.status === "running");

  // The stinger's score runs on a clock from when it came up.
  const [stingerSec, setStingerSec] = useState<number | null>(null);
  useEffect(() => {
    if (kind !== "stinger") return setStingerSec(null);
    const start = performance.now();
    setStingerSec(0);
    const h = setInterval(() => setStingerSec((performance.now() - start) / 1000), 250);
    return () => clearInterval(h);
  }, [kind, live?.id]);
  const stinger = stingerSec === null ? undefined : stingerBed(stingerSec);
  const cuedStinger = useRef(new Set<number>());
  useEffect(() => {
    if (stingerSec === null) return void cuedStinger.current.clear();
    if (!engine || !running || !snd.auto) return;
    STINGER_CUES.forEach(([at, id], i) => {
      if (stingerSec >= at && stingerSec < at + 2 && !cuedStinger.current.has(i)) {
        cuedStinger.current.add(i);
        engine.play(id, { vol: 0.8 });
      }
    });
  }, [stingerSec, engine, running, snd.auto]);

  const mix = tableMix({ sound: snd, kind, ambientId: amb?.id, seats, fighting, stinger });
  const mixKey = JSON.stringify(mix);
  useEffect(() => {
    // The Table and the stinger glide; everything else follows the DM's fade.
    engine?.setMix(mix, kind === "table" ? 4 : kind === "stinger" ? 2 : snd.fade);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, mixKey]);
  useEffect(() => engine?.setDuck(duckFor(kind)), [engine, kind]);

  // ---- One-shots
  const play = (id: string, o?: Parameters<NonNullable<typeof engine>["play"]>[1]) => {
    if (engine?.running) engine.play(id, o);
  };
  const auto = (id: string, o?: Parameters<NonNullable<typeof engine>["play"]>[1]) => snd.auto && play(id, o);

  // The DM's cue (whatever "moments" is set to).
  useChange(snd.cue?.n, () => snd.cue && play(snd.cue.id));

  // Scenes changing.
  useChange(amb ? `a:${amb.id}` : live?.id, () => {
    if (kind === "handout" || kind === "map" || kind === "notice") auto("page", { vol: 0.7 });
    else if (kind === "portrait" || kind === "image" || kind === "ambient") auto("whoosh", { vol: 0.45 });
  });

  // Dice on the TV: the rattle and tumble, landing as the screen does; a natural 20 or 1 gets its sting.
  const roll = view.diceRoll;
  useChange(roll?.n, () => {
    if (!roll) return;
    const count = roll.groups.reduce((a, g) => a + g.rolls.length, 0);
    const settle = (TUMBLE_MS + Math.min(count - 1, 12) * STAGGER_MS) / 1000;
    auto("dice", { dur: settle - 0.3, count });
    const nat = natural(roll);
    if (nat === 20) auto("crit", { delay: settle });
    else if (nat === 1) auto("fumble", { delay: settle });
  });

  // Fights.
  const f = view.fight;
  useChange(f?.id, () => f && auto("horn", { vol: 0.8 }));
  useChange(f ? `${f.id}:${f.status}` : undefined, () => {
    if (!f) return;
    if (f.status === "running" && f.round <= 1) auto("round");
    if (f.status === "over" && f.over) auto(f.over.outcome === "won" ? "victory" : f.over.outcome === "fallen" ? "defeat" : "gong");
  });
  // A new turn gets a drum; a new round, two.
  const turnKey = f && f.status === "running" ? `${f.id}|${f.round}|${f.currentId}` : null;
  const prevTurn = useRef(turnKey);
  useEffect(() => {
    const was = prevTurn.current;
    prevTurn.current = turnKey;
    if (!turnKey || !was || was === turnKey) return;
    const [id0, r0] = was.split("|");
    const [id1, r1] = turnKey.split("|");
    if (id0 !== id1) return;
    auto(r0 !== r1 ? "round" : "turn");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey]);
  useChange(f?.moment?.n, () => {
    const m = f?.moment;
    if (!m) return;
    if (m.kind === "crit") {
      auto("sword-clash");
      auto("crit", { delay: 0.1 });
    } else if (m.kind === "monsterDown") auto("death");
    else if (m.kind === "playerDown") auto("fallen");
  });

  // Moments.
  useChange(view.renownMoment?.n, () => auto("fanfare"));
  useChange(view.levelMoment?.n, () => auto("level-up"));

  // The Table: a candle and a chord for each seat claimed, a cheer when the last one lights.
  const total = view.table?.seats.length ?? 0;
  const prevLit = useRef(lit);
  useEffect(() => {
    const was = prevLit.current;
    prevLit.current = lit;
    if (!view.table || lit <= was) return;
    auto("seat");
    if (lit === total && total > 0) auto("cheer", { delay: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lit]);

  // ---- The note
  const wanted = engine && !running && (pref === "on" || dmUsed);
  if (!wanted) return null;
  return (
    <button
      type="button"
      className="tv-sound-wake"
      onClick={() => {
        void engine.unlock().then(() => {
          setRunning(engine.running);
          writeSoundPref("on");
        });
      }}
    >
      <SpeakerIcon size={18} /> Click anywhere for sound
    </button>
  );
}

function readPrefNow() {
  try {
    return localStorage.getItem("candlefair-tv-sound");
  } catch {
    return null;
  }
}

/** Run fn when key changes to something (not on the first render). */
function useChange(key: string | number | undefined | null, fn: () => void) {
  const last = useRef(key);
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (key === last.current) return;
    last.current = key;
    if (key === undefined || key === null) return;
    ref.current();
  }, [key]);
}
