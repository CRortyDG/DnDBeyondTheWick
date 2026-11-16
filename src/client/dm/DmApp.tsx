
import { reviewCount } from "./ReviewMadeUp";
import { pendingRequests } from "@/shared/requests";
import { OffScriptButton } from "./OffScript";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type { DmCommand } from "@/shared/commands";
import type { DmView } from "@/shared/projection";
import { api, absoluteHref, authHeaders, hrefFor, practiceHref, rememberKey, type Ident } from "../api";
import { PracticeBar, PracticeButton } from "./Practice";
import { useGame, type CallResult } from "../useGame";
import { Notice } from "../ui/Notice";
import { Purse } from "../ui/Purse";
import { SceneView } from "../ui/SceneView";
import { categoriesWith, ShopBoard } from "../ui/ShopBoard";
import { Stage } from "../ui/Stage";
import { projectTv } from "@/shared/projection";
import type { GameState } from "@/shared/types";
import { TvIcon, CandleIcon, InspirationIcon as DiceIcon } from "../ui/icons";
import { DmContext, type DmCtx } from "./context";
import { nextSessionNumber } from "@/shared/reducer";
import { BankPanel } from "./BankPanel";
import { ShopPanel } from "./ShopPanel";
import { ScenesPanel } from "./ScenesPanel";
import { DiscoveryPanel } from "./DiscoveryPanel";
import { LeadsPanel } from "./LeadsPanel";
import { PlayersPanel } from "./PlayersPanel";
import { GamePanel } from "./GamePanel";
import { EpisodesPanel } from "./EpisodesPanel";
import { RunGame } from "./RunGame";
import { LiveMapControls } from "./LiveMapControls";
import { MapEditor } from "./MapEditor";
import { TableMap } from "./TableMap";
import { Inbox } from "./Inbox";
import { EndSessionDialog } from "./Dues";
import { ReadyDialog } from "./ReadyDialog";
import { readiness } from "@/shared/readiness";
import { tonightsInvite } from "@/shared/invites";
import { duesFor } from "@/shared/progress";
import { ArrivalPanel } from "./ArrivalPanel";
import { InvitesPanel } from "./InvitesPanel";
import { ChroniclePanel } from "./ChroniclePanel";
import { BoardPanel } from "./BoardPanel";
import { RenownChip } from "./RenownControl";
import { FightScreen } from "./FightScreen";
import { IntroRemote } from "./IntroRemote";
import { Storyboard } from "./Storyboard";
import { StoryPanel } from "./StoryPanel";
import { MonstersPanel } from "./MonstersPanel";
import { CompanionsPanel } from "./CompanionsPanel";
import { FightOverlay } from "../ui/FightOverlay";
import { DiceButton, DiceTray, PlayerRollCards, TvDiceBar } from "./DiceTray";
import { Finder, QuickBar, quickKey, typing } from "./QuickBar";
import { quickOf } from "@/shared/assets";
import { WorldPanel } from "./WorldPanel";
import { partiesOf, tableParty } from "@/shared/world";
import { BuilderPanel, usePendingDrafts } from "./BuilderPanel";
import { TablesPanel } from "./TablesPanel";
import { usePhone, usePhoneAttr, useTablet, useTabletAttr, useWakeLock } from "./tablet";
import { FullScreenButton, TabletOffer } from "./TabletBits";
import { MailIcon, DieIcon, SparkIcon, BoardIcon, BookIcon, CoinIcon, EyeIcon, GearIcon, GlobeIcon, ListIcon, MapIcon, PanelRightIcon, PeopleIcon, PinIcon, PlayIcon, QuillIcon, SearchIcon, ShipIcon, SkullIcon, StoreIcon, SwordIcon } from "./navIcons";

type Tab = "world" | "bank" | "shop" | "board" | "scenes" | "discovery" | "leads" | "players" | "arrival" | "invites" | "story" | "episodes" | "monsters" | "companions" | "tables" | "chronicle" | "builder" | "game";
type NavItem = { id: Tab; label: string; icon: (p: { size?: number }) => ReactElement; key?: string };
/** The DM pages, grouped by when you reach for them. */
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "At the table",
    items: [
      { id: "bank", label: "Bank", icon: CoinIcon, key: "B" },
      { id: "players", label: "Players", icon: PeopleIcon },
      { id: "shop", label: "Shop", icon: StoreIcon },
    ],
  },
  {
    group: "World",
    items: [
      { id: "world", label: "Parties & world", icon: GlobeIcon },
      { id: "discovery", label: "Discovery", icon: EyeIcon },
      { id: "leads", label: "Leads", icon: PinIcon },
      { id: "scenes", label: "Maps & props", icon: MapIcon },
      { id: "board", label: "Notice board", icon: BoardIcon },
      { id: "monsters", label: "Monsters", icon: SkullIcon },
      { id: "companions", label: "Companions", icon: PeopleIcon },
      { id: "tables", label: "Random tables", icon: DieIcon },
    ],
  },
  {
    group: "Prep",
    items: [
      { id: "episodes", label: "Episodes", icon: ListIcon },
      { id: "story", label: "Storyboard", icon: BookIcon },
      { id: "invites", label: "Invites", icon: MailIcon },
      { id: "arrival", label: "Arrival", icon: ShipIcon },
      { id: "chronicle", label: "Chronicle", icon: QuillIcon },
      { id: "builder", label: "Worldbuilder", icon: SparkIcon },
    ],
  },
];
const SETTINGS: NavItem = { id: "game", label: "Settings", icon: GearIcon };
const ALL_TABS: Tab[] = [...NAV.flatMap((g) => g.items.map((i) => i.id)), SETTINGS.id];
/** Pages that draw their own header (with summary and buttons). */
const OWN_HEAD = new Set<Tab>(["world", "bank", "players", "arrival", "invites", "shop", "discovery", "leads", "scenes", "board", "monsters", "companions", "tables", "episodes", "story", "chronicle", "builder", "game"]);
const PAGE_LABEL = Object.fromEntries([...NAV.flatMap((g) => g.items), SETTINGS].map((i) => [i.id, i.label])) as Record<Tab, string>;

/** The page in the address (#page=discovery), so a reload keeps your place. */
function pageFromUrl(): Tab {
  try {
    const p = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("page");
    return p && (ALL_TABS as string[]).includes(p) ? (p as Tab) : "bank";
  } catch {
    return "bank";
  }
}
function pageToUrl(tab: Tab) {
  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const was = hash.get("page");
    if (was === tab) return;
    hash.set("page", tab);
    // A new history entry per page, so the browser's Back goes to the page before.
    const url = window.location.pathname + window.location.search + "#" + hash.toString();
    if (was) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  } catch {}
}

const RAIL_KEY = "candlefair-dm-rail";
function readRail(): boolean {
  try {
    return localStorage.getItem(RAIL_KEY) !== "closed";
  } catch {
    return true;
  }
}

export function DmApp({ ident: initial }: { ident: Ident }) {
  const [ident, setIdent] = useState(initial);
  const g = useGame<DmView>(ident);

  if (g.phase === "invalid") {
    return <KeyPrompt game={ident.game} onKey={(key) => (rememberKey(ident, key), setIdent({ ...ident, key }))} wrong={!!ident.key} />;
  }
  if (g.phase === "no-game") return ident.practice ? <PracticeOver game={ident.game} /> : <NoCampaign game={ident.game} />;
  if (!g.view || g.view.role !== "dm") {
    if (g.phase === "error") return <Notice title="Can't reach the server">{g.error ?? "Trying again"}...</Notice>;
    return <div className="dm-root" aria-busy="true" />;
  }
  return <DmConsole view={g.view} ident={ident} online={g.online} send={g.send} call={g.call} />;
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
        {wrong ? <p className="error-text">That key didn&rsquo;t work.</p> : <p>Open your saved DM link on this device, or paste the key from it (the part after <code>#key=</code>).</p>}
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

function PracticeOver({ game }: { game: string }) {
  return (
    <Notice title="No practice going">
      <p>This practice copy has ended (or never started). The live game is as you left it.</p>
      <a className="btn primary" href={hrefFor(game, "DM")}>
        Back to the live game
      </a>
    </Notice>
  );
}

function NoCampaign({ game }: { game: string }) {
  return (
    <Notice title="No campaign here">
      <p>
        There&rsquo;s no campaign with the code <b>{game}</b>. Check the DM link you saved, or <a href="/">start a new campaign</a>.
      </p>
    </Notice>
  );
}

/** Fetch DM-only art with the key header and keep it as a local blob URL. */
const GATED_NAMES = ["merchant-sigil", "artum", "mags-wick", "chef"];

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

function DmConsole({ view, ident, online, send, call }: { view: DmView; ident: Ident; online: boolean; send: (c: object) => Promise<string | null>; call: (c: object) => Promise<CallResult> }) {
  const [tab, setTab] = useState<Tab>(pageFromUrl);
  useEffect(() => pageToUrl(tab), [tab]);
  useEffect(() => {
    const back = () => setTab(pageFromUrl());
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  const [railOpen, setRailOpen] = useState(readRail);
  const toggleRail = useCallback(() => {
    setRailOpen((v) => {
      try {
        localStorage.setItem(RAIL_KEY, v ? "closed" : "open");
      } catch {}
      return !v;
    });
  }, []);
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

  const gated = useGatedArt(ident, GATED_NAMES);
  const [drafts, recountDrafts] = usePendingDrafts(ident);
  const [editingMap, setEditingMap] = useState<string | null>(null);
  /** The finder: open (optionally to pin onto one key) or closed. */
  const [finder, setFinder] = useState<{ pinTo?: number } | null>(null);
  /** The storyboard, full-screen; the string is a beat to open (or "" for none). */
  const [storyOpen, setStoryOpen] = useState<string | null>(null);
  const closeStory = useCallback(() => setStoryOpen(null), []);
  const [ending, setEnding] = useState(false);
  const [ready, setReady] = useState(false);
  const closeMap = useCallback(() => setEditingMap(null), []);
  const [tableMap, setTableMap] = useState<string | null>(null);
  const closeTable = useCallback(() => setTableMap(null), []);
  const [diceOpen, setDiceOpen] = useState(false);
  const toggleDice = useCallback(() => setDiceOpen((v) => !v), []);
  // Rolls from before this page opened count as seen, so a reload doesn't pop old cards.
  const [diceSeen, setDiceSeen] = useState(() => s.rolls?.at(-1)?.n ?? 0);
  const seeDice = useCallback((n: number) => setDiceSeen((x) => Math.max(x, n)), []);
  const [diceGone, setDiceGone] = useState<number[]>([]);
  const dismissRoll = useCallback((n: number) => setDiceGone((g) => [...g.slice(-50), n]), []);
  const ctx: DmCtx = useMemo(
    () => ({ view, ident, run, toast, gated, call, openMap: setEditingMap, openTable: setTableMap, diceOpen, toggleDice, diceSeen, seeDice, diceGone, dismissRoll }),
    [view, ident, run, toast, gated, call, diceOpen, toggleDice, diceSeen, seeDice, diceGone, dismissRoll],
  );

  /** S: open the shop on the TV (at a shop the party can see), or close it. */
  const toggleShop = () => {
    if (s.live.shopOpen) return void run({ type: "live.shop", open: false });
    const open = s.shops.filter((x) => x.visibility === "all");
    const target = open.find((x) => x.id === s.live.shopId) ?? open[0];
    if (!target) return toast("Every shop is hidden. Open one to everyone under Shop first.");
    void run({ type: "live.shop", open: true, shopId: target.id });
  };

  // Run-game mode. It reopens on reload (or on another device) while an episode
  // is running, unless you left it on this device during this session.
  const session0 = s.sessions.find((x) => x.id === s.currentSessionId);
  const runKey = `candlefair-run-left:${ident.game}`;
  const [runOpen, setRunOpen] = useState(() => {
    if (!session0?.run) return false;
    try {
      return sessionStorage.getItem(runKey) !== session0.id;
    } catch {
      return true;
    }
  });
  const [pickEpisode, setPickEpisode] = useState<string>("");

  // Combat mode. The fight screen opens whenever a fight starts (from here, the
  // Monsters tab or a run sheet beat), and on reload, unless you left it on this device.
  const fightKey = `candlefair-fight-left:${ident.game}`;
  const fightId = s.fight?.id;
  const [fightOpen, setFightOpen] = useState(() => {
    if (!fightId) return false;
    try {
      return sessionStorage.getItem(fightKey) !== fightId;
    } catch {
      return true;
    }
  });
  const lastFight = useRef(fightId);
  useEffect(() => {
    if (fightId && fightId !== lastFight.current) {
      setFightOpen(true);
      window.scrollTo(0, 0);
    }
    lastFight.current = fightId;
  }, [fightId]);
  const leaveFight = useCallback(() => {
    setFightOpen(false);
    try {
      if (fightId) sessionStorage.setItem(fightKey, fightId);
    } catch {}
  }, [fightKey, fightId]);
  const openFight = useCallback(() => {
    try {
      sessionStorage.removeItem(fightKey);
    } catch {}
    setFightOpen(true);
    window.scrollTo(0, 0);
  }, [fightKey]);
  const startFight = () => run({ type: "fight.start" }, "Roll initiative! The TV and phones are asking.");
  const leaveRun = useCallback(() => {
    setRunOpen(false);
    try {
      if (s.currentSessionId) sessionStorage.setItem(runKey, s.currentSessionId);
    } catch {}
  }, [runKey, s.currentSessionId]);
  const startRun = useCallback(
    async (episodeId: string) => {
      if (await run({ type: "run.start", episodeId })) {
        try {
          sessionStorage.removeItem(runKey);
        } catch {}
        setRunOpen(true);
        window.scrollTo(0, 0);
      }
    },
    [run, runKey],
  );

  const askedShop = useRef(s.live.shopId);
  useEffect(() => {
    askedShop.current = s.live.shopId;
  }, [s.live.shopId, view.version]);

  // Keyboard: 0-9 the quick bar, / the finder, arrows step through the bar, S shop on TV, P purse, B bank, T The Table, L map legend, Esc closes the shop (or zooms the map back out).
  useEffect(() => {
    if (runOpen || finder || storyOpen !== null) return; // run-game mode and the storyboard have their own keys; the finder has the keyboard while it's open
    const onKey = (e: KeyboardEvent) => {
      if (typing(e)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      // On the fight screen the digits type damage, so the quick bar waits.
      if (!fightOpen && quickKey(e, { show: (ref) => void run({ type: "show", ref }), find: () => setFinder({}), quick: quickOf(s) })) {
        // handled
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
      else if (k === "t" || k === "T") void run({ type: "arrival.showTable" });
      else if (k === "Escape" && s.live.shopOpen) void run({ type: "live.shop", open: false });
      else if (k === "Escape" && s.live.focus) void run({ type: "live.focus", pinId: null });
      else if (k === "l" || k === "L") {
        const m = s.scenes.find((x) => x.id === s.live.sceneId);
        if (m?.kind !== "map" || !m.map) return;
        void run({ type: "map.legend", sceneId: m.id, on: !m.map.legendOn });
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s, s.scenes, s.shops, s.live.shopOpen, s.live.shopId, s.live.purseVisible, s.live.sceneId, s.live.focus, run, runOpen, fightOpen, finder, storyOpen]);

  // Cmd+K / Ctrl+K opens the finder too (/ still does), from anywhere in the console.
  useEffect(() => {
    if (runOpen || storyOpen !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setFinder((f) => (f ? null : {}));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runOpen, storyOpen]);

  const live = s.scenes.find((x) => x.id === s.live.sceneId) ?? s.scenes[0];
  const purse = s.players.filter((p) => !p.archived && !p.away).map((p) => ({ id: p.id, name: p.name, balanceCp: p.balanceCp, inspired: !!p.inspired }));
  // What the TV sees, for the preview (hidden prices stay hidden here too).
  const tvView = projectTv(s as unknown as GameState, view.version);
  // Maps preview exactly what the TV gets: discovered pins only.
  const baseScene = tvView.scenes.find((x) => x.id === live.id) ?? { ...live, map: undefined };
  // An ambient scene stands in for the black screen, as on the TV.
  const previewScene = tvView.live.ambient ? { ...baseScene, id: `ambient/${tvView.live.ambient.id}`, ambient: tvView.live.ambient } : baseScene;
  const session = s.sessions.find((x) => x.id === s.currentSessionId);
  // Tablet mode (Settings → This device): bigger touch targets, and the screen stays awake while a session runs.
  const tablet = useTablet();
  useTabletAttr(tablet);
  // Phone layout (Settings → This device, automatic on narrow screens): slim top bar, tabs along the bottom.
  const phone = usePhone();
  usePhoneAttr(phone);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [tvOpen, setTvOpen] = useState(false);
  const pickPage = useCallback((t: Tab) => {
    setTab(t);
    setPagesOpen(false);
    setTvOpen(false);
    window.scrollTo(0, 0);
  }, []);
  useWakeLock(tablet && !!session);
  const seated = s.world ? tableParty(s) : undefined;
  const liveShop = s.shops.find((x) => x.id === s.live.shopId);

  const openTv = () => {
    if (s.practice) window.open(practiceHref(ident.game, "TV"), `candlefair-practice-tv-${ident.game}`, "popup,width=1280,height=720");
    else window.open(hrefFor(ident.game, "TV"), "candlefair-tv", "popup,width=1280,height=720");
  };

  const episodes = s.episodes ?? [];
  const runningEp = session?.run ? episodes.find((e) => e.id === session.run!.episodeId) : undefined;
  const chosenEp = episodes.find((e) => e.id === pickEpisode) ?? episodes[0];

  // Phone layout: the one button that matters right now sits in the top bar; the rest live under ⋯.
  const primary = s.fight ? (
    <button className="btn primary" type="button" onClick={openFight}>
      <SwordIcon /> Fight
    </button>
  ) : runningEp ? (
    <button className="btn primary" type="button" onClick={() => startRun(runningEp.id)}>
      <PlayIcon size={12} /> Resume
    </button>
  ) : !session ? (
    <button className="btn primary" type="button" onClick={() => (readiness(s).length || tonightsInvite(s, Date.now()) ? setReady(true) : void run({ type: "session.start" }, "Session started. The TV is back on the notice board."))}>
      Start session {nextSessionNumber(s)}
    </button>
  ) : chosenEp ? (
    <button className="btn primary" type="button" onClick={() => startRun(chosenEp.id)} title={`Run “${chosenEp.title}”`}>
      <PlayIcon size={12} /> Run
    </button>
  ) : null;
  const showRail = phone ? tvOpen : railOpen;

  // The fight screen and run-game mode replace the console; the dice tray and toasts stay put across all three.
  const screen =
    fightOpen && s.fight ? (
      <FightScreen onExit={leaveFight} />
    ) : runOpen && session?.run ? (
      <RunGame onExit={leaveRun} onFight={openFight} />
    ) : (
      <div className={`dm-root dm-shell${railOpen && !phone ? " rail-open" : ""}`}>
        {phone ? (
          <header className={`dm-top pm-top${moreOpen ? " more-open" : ""}`}>
            <div className="dm-brand">
              <CandleIcon size={22} />
              <div className="dm-brand-text">
                <div className="dm-title">{s.name}</div>
                <div className="dm-subtitle">
                  {seated ? (
                    <>
                      <span className="party-dot" style={{ background: seated.color }} aria-hidden="true" /> {seated.name} ·{" "}
                    </>
                  ) : null}
                  {session ? `${session.title} · running` : "Between sessions"}
                </div>
              </div>
            </div>
            <span className={`conn${online ? " ok" : ""}`} role="status">
              {online ? "Live" : "Reconnecting"}
            </span>
            <span className="spacer" />
            <DiceButton />
            {primary}
            <button className={`btn icon-only pm-more-btn${moreOpen ? " on" : ""}`} type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)} aria-label="More">
              <MoreIcon />
              {pendingRequests(s).length + s.tasks.filter((t) => !t.done).length ? <span className="pm-dot-badge" aria-hidden="true" /> : null}
            </button>
            {moreOpen ? <div className="pm-scrim" role="presentation" onClick={() => setMoreOpen(false)} /> : null}
            {/* Always mounted, so O and I keep working and their panels outlive the menu. */}
            <div className={`pm-more${moreOpen ? " open" : ""}`} role={moreOpen ? "menu" : undefined} aria-label="More" onClickCapture={(e) => {
              // Let selects be changed; any button closes the menu after it does its job.
              if ((e.target as HTMLElement).closest("button, a")) setTimeout(() => setMoreOpen(false), 0);
            }}>
              {moreOpen ? <div className="pm-grab" aria-hidden="true" /> : null}
              <button type="button" className="dm-find" onClick={() => setFinder({})} title="Find anything to show on the TV">
                <SearchIcon />
                <span className="dm-find-text">Find or show anything</span>
                <span className="key">/</span>
              </button>
              <RenownChip />
              <OffScriptButton enabled={!runOpen && !finder && storyOpen === null && !editingMap} />
              <Inbox />
              {s.fight ? null : (
                <button className="btn icon-only" type="button" onClick={startFight} title="Start a fight: Roll initiative! on the TV and phones" aria-label="Start fight">
                  <SwordIcon />
                </button>
              )}
              {s.vttUrl ? (
                <a className="btn icon-only" href={s.vttUrl} target="_blank" rel="noopener noreferrer" title="Launch VTT" aria-label="Launch VTT">
                  <DiceIcon />
                </a>
              ) : null}
              <button className="btn icon-only" type="button" onClick={openTv} title={`Open the TV window: ${absoluteHref(ident.game, "TV")}`} aria-label="Open TV window">
                <TvIcon />
              </button>
              <button className={`btn icon-only${railOpen ? " on" : ""}`} type="button" onClick={toggleRail} aria-pressed={railOpen} title={railOpen ? "Hide the TV panel" : "Show the TV panel"} aria-label="TV panel">
                <PanelRightIcon />
              </button>
              <FullScreenButton />
              <span className="dm-top-sep" aria-hidden="true" />
              {s.practice ? null : <PracticeButton episodeId={(runningEp ?? chosenEp)?.id} episodeTitle={(runningEp ?? chosenEp)?.title} />}
              {session ? (
                <button className="btn" type="button" onClick={() => setEnding(true)}>
                  End session
                </button>
              ) : null}
              {runningEp ? (
                <button className={`btn${s.fight ? "" : " primary"}`} type="button" onClick={() => startRun(runningEp.id)}>
                  <PlayIcon size={12} /> Resume {runningEp.title}
                </button>
              ) : chosenEp ? (
                <span className="run-pick">
                  {episodes.length > 1 ? (
                    <select className="fld" aria-label="Episode to run" value={chosenEp.id} onChange={(e) => setPickEpisode(e.target.value)}>
                      {episodes.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button className={`btn${session && !s.fight ? " primary" : ""}`} type="button" onClick={() => startRun(chosenEp.id)} title={`Run “${chosenEp.title}”`}>
                    <PlayIcon size={12} /> Run{episodes.length > 1 ? "" : ` ${chosenEp.title}`}
                  </button>
                </span>
              ) : null}
              {session || !s.world || partiesOf(s).length < 2 ? null : (
                <select className="fld" aria-label="Party at the table" value={s.partyId ?? ""} onChange={(e) => e.target.value && void run({ type: "party.play", partyId: e.target.value }, "Seated.")} title="The party at the table">
                  {partiesOf(s).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {session ? null : (
                <button className="btn primary" type="button" onClick={() => (readiness(s).length || tonightsInvite(s, Date.now()) ? setReady(true) : void run({ type: "session.start" }, "Session started. The TV is back on the notice board."))}>
                  Start session {nextSessionNumber(s)}
                </button>
              )}
              {s.fight ? (
                <button className="btn primary" type="button" onClick={openFight}>
                  <SwordIcon /> Back to the fight
                </button>
              ) : null}
            </div>
          </header>
        ) : (
          <header className="dm-top">
            <div className="dm-brand">
              <CandleIcon size={22} />
              <div className="dm-brand-text">
                <div className="dm-title">{s.name}</div>
                <div className="dm-subtitle">
                  {seated ? (
                    <>
                      <span className="party-dot" style={{ background: seated.color }} aria-hidden="true" /> {seated.name} ·{" "}
                    </>
                  ) : null}
                  {session ? `${session.title} · running` : "Between sessions"}
                </div>
              </div>
            </div>
            <span className={`conn${online ? " ok" : ""}`} role="status">
              {online ? "Live" : "Reconnecting"}
            </span>
            <span className="spacer" />
            <button type="button" className="dm-find" onClick={() => setFinder({})} title="Find anything to show on the TV">
              <SearchIcon />
              <span className="dm-find-text">Find or show anything</span>
              <span className="key">/</span>
            </button>
            <RenownChip />
            <OffScriptButton enabled={!runOpen && !finder && storyOpen === null && !editingMap} />
            <Inbox />
            {s.fight ? null : (
              <button className="btn icon-only" type="button" onClick={startFight} title="Start a fight: Roll initiative! on the TV and phones" aria-label="Start fight">
                <SwordIcon />
              </button>
            )}
            <DiceButton />
            {s.vttUrl ? (
              <a className="btn icon-only" href={s.vttUrl} target="_blank" rel="noopener noreferrer" title="Launch VTT" aria-label="Launch VTT">
                <DiceIcon />
              </a>
            ) : null}
            <button className="btn icon-only" type="button" onClick={openTv} title={`Open the TV window: ${absoluteHref(ident.game, "TV")}`} aria-label="Open TV window">
              <TvIcon />
            </button>
            <button className={`btn icon-only${railOpen ? " on" : ""}`} type="button" onClick={toggleRail} aria-pressed={railOpen} title={railOpen ? "Hide the TV panel" : "Show the TV panel"} aria-label="TV panel">
              <PanelRightIcon />
            </button>
            <FullScreenButton />
            <span className="dm-top-sep" aria-hidden="true" />
            {s.practice ? null : <PracticeButton episodeId={(runningEp ?? chosenEp)?.id} episodeTitle={(runningEp ?? chosenEp)?.title} />}
            {session ? (
              <button className="btn" type="button" onClick={() => setEnding(true)}>
                End session
              </button>
            ) : null}
            {runningEp ? (
              <button className={`btn${s.fight ? "" : " primary"}`} type="button" onClick={() => startRun(runningEp.id)}>
                <PlayIcon size={12} /> Resume {runningEp.title}
              </button>
            ) : chosenEp ? (
              <span className="run-pick">
                {episodes.length > 1 ? (
                  <select className="fld" aria-label="Episode to run" value={chosenEp.id} onChange={(e) => setPickEpisode(e.target.value)}>
                    {episodes.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                ) : null}
                <button className={`btn${session && !s.fight ? " primary" : ""}`} type="button" onClick={() => startRun(chosenEp.id)} title={`Run “${chosenEp.title}”`}>
                  <PlayIcon size={12} /> Run{episodes.length > 1 ? "" : ` ${chosenEp.title}`}
                </button>
              </span>
            ) : null}
            {session || !s.world || partiesOf(s).length < 2 ? null : (
              <select className="fld" aria-label="Party at the table" value={s.partyId ?? ""} onChange={(e) => e.target.value && void run({ type: "party.play", partyId: e.target.value }, "Seated.")} title="The party at the table">
                {partiesOf(s).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {session ? null : (
              <button className="btn primary" type="button" onClick={() => (readiness(s).length || tonightsInvite(s, Date.now()) ? setReady(true) : void run({ type: "session.start" }, "Session started. The TV is back on the notice board."))}>
                Start session {nextSessionNumber(s)}
              </button>
            )}
            {s.fight ? (
              <button className="btn primary" type="button" onClick={openFight}>
                <SwordIcon /> Back to the fight
              </button>
            ) : null}
          </header>
        )}
        {ending && session ? <EndSessionDialog session={session} onClose={() => setEnding(false)} /> : null}
        {ready && !session ? <ReadyDialog onClose={() => setReady(false)} onGo={(page) => setTab(page)} /> : null}

        {s.knocks.length ? (
          <div className="dm-knocks" role="status">
            {s.knocks.map((k) => (
              <span key={k.id} className="knock">
                <span className="knock-tag">Knocking</span>
                <span>
                  <b>{k.handle}</b> wants a seat.
                </span>
                <span className="spacer" />
                <button className="btn small" type="button" onClick={() => run({ type: "knock.dismiss", knockId: k.id })}>
                  Dismiss
                </button>
                <button className="btn small primary" type="button" onClick={() => run({ type: "knock.admit", knockId: k.id }, `Let ${k.handle} in.`)}>
                  Let in
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="dm-body">
          <nav className="dm-side" aria-label="DM pages">
            {NAV.map((g) => (
              <div key={g.group} className="dm-nav">
                <div className="dm-nav-h">{g.group}</div>
                {g.items.map((it) => (
                  <NavButton key={it.id} item={it} current={tab === it.id} onPick={setTab} count={it.id === "players" ? s.knocks.length : it.id === "builder" ? drafts + reviewCount(s) : 0} />
                ))}
              </div>
            ))}
            <div className="dm-nav dm-nav-foot">
              <NavButton item={SETTINGS} current={tab === SETTINGS.id} onPick={setTab} />
            </div>
          </nav>

          <main className="dm-main" id={`panel-${tab}`} aria-label={PAGE_LABEL[tab]}>
            {OWN_HEAD.has(tab) ? null : (
              <div className="dm-pagehead">
                <h1>{PAGE_LABEL[tab]}</h1>
              </div>
            )}
            <div className="panel">
              {tab === "world" ? <WorldPanel /> : null}
              {tab === "bank" ? <BankPanel /> : null}
              {tab === "shop" ? <ShopPanel /> : null}
              {tab === "board" ? <BoardPanel /> : null}
              {tab === "scenes" ? <ScenesPanel /> : null}
              {tab === "discovery" ? <DiscoveryPanel /> : null}
              {tab === "leads" ? <LeadsPanel /> : null}
              {tab === "players" ? <PlayersPanel /> : null}
              {tab === "arrival" ? <ArrivalPanel /> : null}
              {tab === "invites" ? <InvitesPanel /> : null}
              {tab === "story" ? <StoryPanel onOpen={(id) => setStoryOpen(id ?? "")} /> : null}
              {tab === "episodes" ? <EpisodesPanel onRun={startRun} /> : null}
              {tab === "monsters" ? <MonstersPanel onFight={openFight} /> : null}
              {tab === "companions" ? <CompanionsPanel /> : null}
              {tab === "chronicle" ? <ChroniclePanel /> : null}
              {tab === "tables" ? <TablesPanel /> : null}
              {tab === "builder" ? <BuilderPanel onCount={recountDrafts} /> : null}
              {tab === "game" ? <GamePanel /> : null}
            </div>
          </main>

          {phone && tvOpen ? <div className="pm-scrim" role="presentation" onClick={() => setTvOpen(false)} /> : null}
          {showRail ? (
            <aside className={`dm-live dm-rail${phone ? " pm-sheet pm-tv" : ""}`} aria-label="What the TV shows">
              {phone ? (
                <div className="pm-sheet-head">
                  <div className="pm-grab" aria-hidden="true" />
                  <button className="btn small" type="button" onClick={() => setTvOpen(false)}>
                    Done
                  </button>
                </div>
              ) : null}
              <div className="dm-rail-head">
                <h2>On the TV</h2>
                <span className="note">
                  {live.label}
                  {live.reveal ? " (reveal)" : ""}
                </span>
              </div>
              <div className="preview" aria-label={`Preview: ${live.label}`}>
                <SceneView town={tvView.game.town} scene={previewScene} gated={gated} table={tvView.table} intro={tvView.intro} board={tvView} emptyHint="No image yet. Add one under Maps & props." />
                {s.live.shopOpen && liveShop ? (
                  <div className="preview-shop" aria-label={`Shop open on the TV: ${liveShop.name}`}>
                    <Stage w={1920} h={1080}>
                      <ShopBoard town={tvView.game.town} shops={tvView.shops} items={tvView.items} shopId={liveShop.id} size="tv" mode={s.live.shopCategory ? "category" : "shop"} category={s.live.shopCategory} />
                    </Stage>
                  </div>
                ) : null}
                {tvView.fight ? (
                  <div className="preview-fight" aria-label="The fight on the TV">
                    <Stage w={1920} h={1080}>
                      <FightOverlay fight={tvView.fight} preview onMap={previewScene?.kind === "map" && !!previewScene.map?.tokens.length} />
                    </Stage>
                  </div>
                ) : null}
                <div className="preview-purse">
                  <Purse players={purse} visible={s.live.purseVisible && live.kind !== "table" && live.kind !== "video" && live.kind !== "intro"} size="small" />
                </div>
              </div>

              <div className="live-toggles">
                <button type="button" className={`btn${s.live.shopOpen ? " on" : ""}`} aria-pressed={s.live.shopOpen} onClick={toggleShop}>
                  <span className="key">S</span> {s.live.shopOpen ? "Close the shop" : "Shop on TV"}
                </button>
                <button type="button" className={`btn${s.live.purseVisible ? " on" : ""}`} aria-pressed={s.live.purseVisible} onClick={() => run({ type: "live.purse", visible: !s.live.purseVisible })}>
                  <span className="key">P</span> Purse
                </button>
              </div>

              {live.kind === "map" && live.map ? <LiveMapControls scene={live} /> : null}
              {live.kind === "intro" ? <IntroRemote intro={tvView.intro} /> : null}

              <QuickBar onFind={(pinTo) => setFinder({ pinTo })} />

              <div className={`live-shops${s.live.shopOpen ? " open" : ""}`} role="group" aria-label="Which shop the TV shows">
                <span className="note">{s.live.shopOpen ? "The TV is showing:" : "Open the shop on the TV at:"}</span>
                {s.shops.filter((sh) => sh.visibility === "all").length === 0 ? <span className="note">Every shop is hidden. Open one to everyone under Shop first.</span> : null}
                {categoriesWith(tvView.items, tvView.game.town).map((c) => {
                  const on = s.live.shopOpen && s.live.shopCategory === c.id;
                  return (
                    <button key={c.id} type="button" className={`btn small${on ? " on" : ""}`} aria-pressed={on} onClick={() => run({ type: "live.shop", open: true, category: c.id })}>
                      {c.label}
                    </button>
                  );
                })}
                {s.shops.filter((sh) => sh.visibility === "all").length ? <span className="note">or a storefront:</span> : null}
                {s.shops
                  .filter((sh) => sh.visibility === "all")
                  .map((sh) => {
                    const on = s.live.shopOpen && !s.live.shopCategory && sh.id === s.live.shopId;
                    return (
                      <button key={sh.id} type="button" className={`btn small${on ? " on" : ""}`} aria-pressed={on} onClick={() => run({ type: "live.shop", open: true, shopId: sh.id })}>
                        {sh.name}
                      </button>
                    );
                  })}
              </div>
              <details className="dm-keys">
                <summary>Keyboard shortcuts</summary>
                <p className="note hint">
                  0&ndash;9 the quick bar &middot; / find anything &middot; &larr; &rarr; step through the bar (or flip shops while the shop is open) &middot; S shop &middot; P purse &middot; B bank &middot; T The Table &middot; I requests &middot; L map legend &middot; Esc closes the shop or zooms the map out
                </p>
              </details>
            </aside>
          ) : null}
        </div>

        {phone ? (
          <PhoneBar
            tab={tab}
            onPick={pickPage}
            pagesOpen={pagesOpen}
            tvOpen={tvOpen}
            onPages={() => (setTvOpen(false), setPagesOpen((v) => !v))}
            onTv={() => (setPagesOpen(false), setTvOpen((v) => !v))}
            counts={{ players: s.knocks.length, builder: drafts + reviewCount(s) }}
          />
        ) : null}
        {editingMap ? <MapEditor sceneId={editingMap} onClose={closeMap} /> : null}
        {finder ? <Finder pinTo={finder.pinTo} onClose={() => setFinder(null)} /> : null}
        {storyOpen !== null ? <Storyboard onClose={closeStory} select={storyOpen || undefined} /> : null}
      </div>
    );

  return (
    <DmContext.Provider value={ctx}>
      {s.practice ? <PracticeBar practice={s.practice} /> : null}
      {screen}
      {tableMap ? <TableMap sceneId={tableMap} onClose={closeTable} /> : null}
      <DiceTray />
      <PlayerRollCards />
      <TvDiceBar />
      <TabletOffer />
      <div className={`toast${toastMsg ? " show" : ""}`} role="status" aria-live="polite">
        {toastMsg?.text}
      </div>
    </DmContext.Provider>
  );
}

function NavButton({ item, current, onPick, count = 0 }: { item: NavItem; current: boolean; onPick: (t: Tab) => void; count?: number }) {
  const Icon = item.icon;
  return (
    <button type="button" className={`dm-nav-item${current ? " on" : ""}`} aria-current={current ? "page" : undefined} onClick={() => onPick(item.id)} title={item.label}>
      <Icon size={16} />
      <span className="dm-nav-label">{item.label}</span>
      {count ? <span className="badge">{count}</span> : item.key ? <span className="key">{item.key}</span> : null}
    </button>
  );
}

const BAR_TABS: Tab[] = ["bank", "players", "discovery"];

/** Phone layout: three everyday pages, the TV panel and every other page, along the bottom. */
function PhoneBar({ tab, onPick, pagesOpen, tvOpen, onPages, onTv, counts }: { tab: Tab; onPick: (t: Tab) => void; pagesOpen: boolean; tvOpen: boolean; onPages: () => void; onTv: () => void; counts: Partial<Record<Tab, number>> }) {
  const items = [...NAV.flatMap((g) => g.items), SETTINGS];
  const elsewhere = !BAR_TABS.includes(tab);
  const otherCount = items.filter((i) => !BAR_TABS.includes(i.id)).reduce((n, i) => n + (counts[i.id] ?? 0), 0);
  return (
    <>
      <nav className="pm-bar" aria-label="DM pages">
        {BAR_TABS.map((id) => {
          const it = items.find((i) => i.id === id)!;
          const Icon = it.icon;
          const on = tab === id && !pagesOpen && !tvOpen;
          return (
            <button key={id} type="button" className={`pm-tab${on ? " on" : ""}`} aria-current={tab === id ? "page" : undefined} onClick={() => onPick(id)}>
              <Icon size={22} />
              <span>{it.label}</span>
              {counts[id] ? <span className="badge">{counts[id]}</span> : null}
            </button>
          );
        })}
        <button type="button" className={`pm-tab${tvOpen ? " on" : ""}`} aria-expanded={tvOpen} onClick={onTv}>
          <TvIcon size={22} />
          <span>TV</span>
        </button>
        <button type="button" className={`pm-tab${pagesOpen || (elsewhere && !tvOpen) ? " on" : ""}`} aria-expanded={pagesOpen} onClick={onPages}>
          <GridIcon />
          <span>{elsewhere ? PAGE_LABEL[tab] : "Pages"}</span>
          {otherCount ? <span className="badge">{otherCount}</span> : null}
        </button>
      </nav>
      {pagesOpen ? (
        <>
          <div className="pm-scrim" role="presentation" onClick={onPages} />
          <div className="pm-sheet pm-pages" role="dialog" aria-label="All pages">
            <div className="pm-grab" aria-hidden="true" />
            {[...NAV, { group: "Campaign", items: [SETTINGS] }].map((g) => (
              <section key={g.group}>
                <h2 className="pm-h">{g.group}</h2>
                <div className="pm-grid">
                  {g.items.map((it) => {
                    const Icon = it.icon;
                    return (
                      <button key={it.id} type="button" className={`pm-tile${tab === it.id ? " on" : ""}`} aria-current={tab === it.id ? "page" : undefined} onClick={() => onPick(it.id)}>
                        <Icon size={22} />
                        <span>{it.label}</span>
                        {counts[it.id] ? <span className="badge">{counts[it.id]}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}
