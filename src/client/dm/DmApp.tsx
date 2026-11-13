"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DmCommand } from "@/shared/commands";
import type { DmView } from "@/shared/projection";
import { api, absoluteHref, authHeaders, hrefFor, rememberKey, type Ident } from "../api";
import { useGame } from "../useGame";
import { Notice } from "../ui/Notice";
import { Purse } from "../ui/Purse";
import { SceneView } from "../ui/SceneView";
import { ShopBoard } from "../ui/ShopBoard";
import { Stage } from "../ui/Stage";
import { projectTv } from "@/shared/projection";
import type { GameState } from "@/shared/types";
import { TvIcon, CandleIcon, InspirationIcon as DiceIcon } from "../ui/icons";
import { DmContext, type DmCtx } from "./context";
import { nextSessionNumber } from "@/shared/reducer";
import { BankPanel } from "./BankPanel";
import { ShopPanel } from "./ShopPanel";
import { ScenesPanel } from "./ScenesPanel";
import { PlayersPanel } from "./PlayersPanel";
import { GamePanel } from "./GamePanel";

type Tab = "bank" | "shop" | "scenes" | "players" | "game";
const TABS: [Tab, string, string][] = [
  ["bank", "Bank", "B"],
  ["shop", "Shop", ""],
  ["scenes", "Scenes", ""],
  ["players", "Players", ""],
  ["game", "Game", ""],
];

export function DmApp({ ident: initial }: { ident: Ident }) {
  const [ident, setIdent] = useState(initial);
  const g = useGame<DmView>(ident);

  if (g.phase === "invalid") {
    return <KeyPrompt game={ident.game} onKey={(key) => (rememberKey(ident, key), setIdent({ ...ident, key }))} wrong={!!ident.key} />;
  }
  if (g.phase === "no-game") return <CreateGame ident={ident} onCreated={g.retryHello} />;
  if (!g.view || g.view.role !== "dm") {
    if (g.phase === "error") return <Notice title="Can't reach the server">{g.error ?? "Trying again"}...</Notice>;
    return <div className="dm-root" aria-busy="true" />;
  }
  return <DmConsole view={g.view} ident={ident} online={g.online} send={g.send} />;
}

function KeyPrompt({ game, onKey, wrong }: { game: string; onKey: (k: string) => void; wrong: boolean }) {
  const [k, setK] = useState("");
  return (
    <Notice title="The DM's table">
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (k.trim()) onKey(k.trim());
        }}
      >
        {wrong ? <p className="error-text">That key didn&rsquo;t work.</p> : <p>Enter the DM key to continue.</p>}
        <label>
          DM key
          <input className="fld" type="password" autoComplete="current-password" value={k} onChange={(e) => setK(e.target.value)} autoFocus />
        </label>
        <button className="btn primary" type="submit">
          Open the DM view
        </button>
        <p className="note">
          Game: <b>{game}</b>. The key is saved on this device only.
        </p>
      </form>
    </Notice>
  );
}

function CreateGame({ ident, onCreated }: { ident: Ident; onCreated: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  return (
    <Notice title={`Set up “${ident.game}”`}>
      <p>There&rsquo;s no game here yet. Create it with Candlefair&rsquo;s scenes, shops and items, and Players 1&ndash;4.</p>
      {err ? <p className="error-text">{err}</p> : null}
      <button
        className="btn primary"
        type="button"
        onClick={async () => {
          try {
            await api("/api/game", ident, { method: "POST" });
            onCreated();
          } catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
          }
        }}
      >
        Create the game
      </button>
    </Notice>
  );
}

/** Fetch DM-only art with the key header and keep it as a local blob URL. */
function useGatedArt(ident: Ident, names: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = names.join(",");
  useEffect(() => {
    let alive = true;
    const made: string[] = [];
    (async () => {
      const out: Record<string, string> = {};
      for (const n of names) {
        try {
          const r = await fetch(`/api/art/${n}?game=${encodeURIComponent(ident.game)}`, { headers: authHeaders(ident), cache: "no-store" });
          if (r.ok) {
            const u = URL.createObjectURL(await r.blob());
            made.push(u);
            out[n] = u;
          }
        } catch {}
      }
      if (alive) setUrls(out);
    })();
    return () => {
      alive = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ident.key, ident.game]);
  return urls;
}

function DmConsole({ view, ident, online, send }: { view: DmView; ident: Ident; online: boolean; send: (c: object) => Promise<string | null> }) {
  const [tab, setTab] = useState<Tab>("bank");
  const [toastMsg, setToastMsg] = useState<{ text: string; n: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = view.state;

  const toast = useCallback((text: string) => {
    setToastMsg((t) => ({ text, n: (t?.n ?? 0) + 1 }));
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const run = useCallback(
    async (cmd: DmCommand, success?: string) => {
      const err = await send(cmd);
      if (err) {
        toast(err);
        return false;
      }
      if (success) toast(success);
      return true;
    },
    [send, toast],
  );

  const gated = useGatedArt(ident, ["merchant-sigil"]);
  const ctx: DmCtx = useMemo(() => ({ view, ident, run, toast, gated }), [view, ident, run, toast, gated]);

  /** S: open the shop on the TV (at a shop the party can see), or close it. */
  const toggleShop = () => {
    if (s.live.shopOpen) return void run({ type: "live.shop", open: false });
    const open = s.shops.filter((x) => x.visibility === "all");
    const target = open.find((x) => x.id === s.live.shopId) ?? open[0];
    if (!target) return toast("Every shop is hidden. Open one to everyone under Shop first.");
    void run({ type: "live.shop", open: true, shopId: target.id });
  };

  const askedShop = useRef(s.live.shopId);
  useEffect(() => {
    askedShop.current = s.live.shopId;
  }, [s.live.shopId, view.version]);

  // Keyboard: 0-9 scenes, arrows step, S shop on TV, P purse, B bank, Esc closes the shop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (/^[0-9]$/.test(k)) {
        const sc = s.scenes.find((x) => x.hotkey === Number(k));
        if (sc) void run({ type: "scene.show", sceneId: sc.id });
      } else if ((k === "ArrowRight" || k === "ArrowLeft") && s.live.shopOpen && s.shops.some((x) => x.visibility === "all")) {
        // While the shop is on the TV, the arrows flip through the shops the party can see.
        // Count from the shop we last asked for, so quick presses add up before the server answers.
        const open = s.shops.filter((x) => x.visibility === "all");
        const i = Math.max(0, open.findIndex((x) => x.id === askedShop.current));
        const n = open.length;
        const next = open[(i + (k === "ArrowRight" ? 1 : -1) + n) % n];
        askedShop.current = next.id;
        void run({ type: "live.shop", open: true, shopId: next.id });
      } else if (k === "ArrowRight") void run({ type: "scene.step", dir: 1 });
      else if (k === "ArrowLeft") void run({ type: "scene.step", dir: -1 });
      else if (k === "s" || k === "S") toggleShop();
      else if (k === "p" || k === "P") void run({ type: "live.purse", visible: !s.live.purseVisible });
      else if (k === "b" || k === "B") setTab("bank");
      else if (k === "Escape" && s.live.shopOpen) void run({ type: "live.shop", open: false });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s.scenes, s.shops, s.live.shopOpen, s.live.shopId, s.live.purseVisible, run]);

  const live = s.scenes.find((x) => x.id === s.live.sceneId) ?? s.scenes[0];
  const purse = s.players.filter((p) => !p.archived && !p.away).map((p) => ({ id: p.id, name: p.name, balanceCp: p.balanceCp, inspired: !!p.inspired }));
  // What the TV sees, for the preview (hidden prices stay hidden here too).
  const tvView = projectTv(s as unknown as GameState, view.version);
  const session = s.sessions.find((x) => x.id === s.currentSessionId);
  const liveShop = s.shops.find((x) => x.id === s.live.shopId);

  const openTv = () => {
    window.open(hrefFor(ident.game, "TV"), "candlefair-tv", "popup,width=1280,height=720");
  };

  return (
    <DmContext.Provider value={ctx}>
      <div className="dm-root">
        <header className="dm-top">
          <div className="dm-brand">
            <CandleIcon size={26} />
            <div>
              <div className="dm-title">{s.name}</div>
              <div className="dm-subtitle">DM view{session ? ` · ${session.title}, running` : " · between sessions"}</div>
            </div>
          </div>
          <span className={`conn${online ? " ok" : ""}`} role="status">
            {online ? "Live" : "Reconnecting"}
          </span>
          <span className="spacer" />
          {session ? (
            <button className="btn" type="button" onClick={() => run({ type: "session.end" }, `${session.title} ended.`)}>
              End session
            </button>
          ) : (
            <button className="btn primary" type="button" onClick={() => run({ type: "session.start" }, "Session started. The TV is back on the notice board.")}>
              Start session {nextSessionNumber(s)}
            </button>
          )}
          {s.vttUrl ? (
            <a className="btn" href={s.vttUrl} target="_blank" rel="noopener noreferrer">
              <DiceIcon /> Launch VTT
            </a>
          ) : null}
          <button className="btn" type="button" onClick={openTv} title={absoluteHref(ident.game, "TV")}>
            <TvIcon /> Open TV window
          </button>
        </header>

        {s.knocks.length ? (
          <div className="dm-knocks" role="status">
            {s.knocks.map((k) => (
              <span key={k.id} className="knock">
                <b>{k.handle}</b> is knocking.
                <button className="btn small primary" type="button" onClick={() => run({ type: "knock.admit", knockId: k.id }, `Let ${k.handle} in.`)}>
                  Let in
                </button>
                <button className="btn small" type="button" onClick={() => run({ type: "knock.dismiss", knockId: k.id })}>
                  Dismiss
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="dm-grid">
          <section className="dm-live box" aria-label="What the TV shows">
            <div className="box-head">
              <h2>On the TV</h2>
              <span className="note">
                {live.label}
                {live.reveal ? " (reveal)" : ""}
              </span>
            </div>
            <div className="preview" aria-label={`Preview: ${live.label}`}>
              <SceneView scene={live} gated={gated} emptyHint="No image yet. Add one under Scenes." />
              {s.live.shopOpen && liveShop ? (
                <div className="preview-shop" aria-label={`Shop open on the TV: ${liveShop.name}`}>
                  <Stage w={1920} h={1080}>
                    <ShopBoard shops={tvView.shops} items={tvView.items} shopId={liveShop.id} size="tv" />
                  </Stage>
                </div>
              ) : null}
              <div className="preview-purse">
                <Purse players={purse} visible={s.live.purseVisible} size="small" />
              </div>
            </div>

            <div className="scene-buttons" role="group" aria-label="Scenes">
              {s.scenes.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  className={`btn scene-btn${sc.id === s.live.sceneId ? " on" : ""}${sc.reveal ? " reveal-btn" : ""}`}
                  aria-pressed={sc.id === s.live.sceneId}
                  onClick={() => run({ type: "scene.show", sceneId: sc.id })}
                >
                  {sc.hotkey !== null ? <span className="key">{sc.hotkey}</span> : null}
                  <span>
                    {sc.label}
                    {sc.reveal ? " (reveal)" : ""}
                  </span>
                </button>
              ))}
            </div>

            <div className="live-toggles">
              <button type="button" className={`btn${s.live.shopOpen ? " on" : ""}`} aria-pressed={s.live.shopOpen} onClick={toggleShop}>
                <span className="key">S</span> {s.live.shopOpen ? "Close the shop" : "Shop on TV"}
              </button>
              <button type="button" className={`btn${s.live.purseVisible ? " on" : ""}`} aria-pressed={s.live.purseVisible} onClick={() => run({ type: "live.purse", visible: !s.live.purseVisible })}>
                <span className="key">P</span> Purse
              </button>
            </div>
            <div className={`live-shops${s.live.shopOpen ? " open" : ""}`} role="group" aria-label="Which shop the TV shows">
              <span className="note">{s.live.shopOpen ? "The TV is showing:" : "Open the shop on the TV at:"}</span>
              {s.shops.filter((sh) => sh.visibility === "all").length === 0 ? (
                <span className="note">Every shop is hidden. Open one to everyone under Shop first.</span>
              ) : null}
              {s.shops.filter((sh) => sh.visibility === "all").map((sh) => {
                const on = s.live.shopOpen && sh.id === s.live.shopId;
                return (
                  <button key={sh.id} type="button" className={`btn small${on ? " on" : ""}`} aria-pressed={on} onClick={() => run({ type: "live.shop", open: true, shopId: sh.id })}>
                    {sh.name}
                  </button>
                );
              })}
            </div>
            <p className="note hint">
              Keys: 0&ndash;9 scenes &middot; &larr; &rarr; step (or flip shops while the shop is open) &middot; S shop &middot; P purse &middot; B bank &middot; Esc closes the shop
            </p>
          </section>

          <section className="dm-panels" aria-label="DM tools">
            <div className="tabs" role="tablist" aria-label="DM tools">
              {TABS.map(([id, label, key]) => (
                <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} className={`btn tab${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>
                  {key ? <span className="key">{key}</span> : null}
                  {label}
                  {id === "players" && s.knocks.length ? <span className="badge">{s.knocks.length}</span> : null}
                </button>
              ))}
            </div>
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="panel">
              {tab === "bank" ? <BankPanel /> : null}
              {tab === "shop" ? <ShopPanel /> : null}
              {tab === "scenes" ? <ScenesPanel /> : null}
              {tab === "players" ? <PlayersPanel /> : null}
              {tab === "game" ? <GamePanel /> : null}
            </div>
          </section>
        </div>

        <div className={`toast${toastMsg ? " show" : ""}`} role="status" aria-live="polite">
          {toastMsg?.text}
        </div>
      </div>
    </DmContext.Provider>
  );
}
