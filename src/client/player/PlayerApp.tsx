"use client";

import { useState } from "react";
import { formatCp, formatDelta } from "@/shared/money";
import type { PlayerView, PublicItem } from "@/shared/projection";
import { hrefFor, rememberKey, type Ident } from "../api";
import { useGame } from "../useGame";
import { Notice } from "../ui/Notice";
import type { ShopMode } from "../ui/ShopBoard";
import { Market } from "./Market";
import type { ItemCategory } from "@/shared/types";
import { Chronicle } from "../ui/Chronicle";
import { BannerToast } from "../ui/BannerToast";
import { InspirationIcon, LockIcon } from "../ui/icons";
import { Jobs } from "./Jobs";
import { Discovery, useDiscoverySeen } from "./Discovery";
import { Dice } from "./Dice";
import { FightCard } from "./FightCard";
import { Maps } from "./PhoneMap";
import { Sheet, useConfirm } from "./Sheet";
import { NAV_ICONS, PlayerNav, type Screen } from "./PlayerNav";
import { DecisionBanners, MyRequests, RequestSheet, SendGold } from "./Requests";

export function PlayerApp({ ident: initial }: { ident: Ident }) {
  const [ident, setIdent] = useState(initial);
  const g = useGame<PlayerView>(ident);

  if (g.phase === "taken") return <Taken ident={ident} onKey={(key) => (rememberKey(ident, key), setIdent({ ...ident, key }))} />;
  if (g.phase === "full")
    return (
      <Notice title="The table is full">
        <p>Every seat is taken tonight, so you&rsquo;ve knocked instead. If the DM lets you in, this page will open by itself.</p>
      </Notice>
    );
  if (g.phase === "knocking")
    return (
      <Notice title="You knocked">
        <p>The door&rsquo;s closed tonight. The DM will let you in in a moment; this page will open by itself.</p>
      </Notice>
    );
  if (g.phase === "invalid")
    return (
      <Notice title="Pick another name">
        <p>That name can&rsquo;t be used here.</p>
        <a className="btn primary" href={hrefFor(ident.game)}>
          Choose a name
        </a>
      </Notice>
    );
  if (g.phase === "no-game") return <Notice title="No table here yet">Ask the DM to set up this game.</Notice>;
  if (!g.view || g.view.role !== "player") {
    if (g.phase === "error") return <Notice title="Can't reach the table">Trying again&hellip;</Notice>;
    return <div className="player-root" aria-busy="true" />;
  }
  return <PlayerScreen view={g.view} online={g.online} send={g.send} ident={ident} setIdent={setIdent} />;
}

function Taken({ ident, onKey }: { ident: Ident; onKey: (k: string) => void }) {
  const [k, setK] = useState("");
  return (
    <Notice title="That name is taken">
      <p>Someone has locked &ldquo;{ident.player}&rdquo;. If it&rsquo;s yours, enter your key.</p>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (k.trim()) onKey(k.trim());
        }}
      >
        <label>
          Your key
          <input className="fld" type="password" value={k} onChange={(e) => setK(e.target.value)} />
        </label>
        <button className="btn primary" type="submit">
          That&rsquo;s me
        </button>
      </form>
      <a className="btn" href={hrefFor(ident.game)}>
        Use another name
      </a>
    </Notice>
  );
}

function PlayerScreen({ view, online, send, ident, setIdent }: { view: PlayerView; online: boolean; send: (c: object) => Promise<string | null>; ident: Ident; setIdent: (i: Ident) => void }) {
  const [shopId, setShopId] = useState(view.live.shopOpen ? view.live.shopId : view.shops[0]?.id);
  const pendingOrders = view.myOrders.filter((o) => !o.arrived);
  const [msg, setMsg] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);
  const [walletOpen, setWalletOpen] = useState<false | "purse" | "send">(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [youOpen, setYouOpen] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [looking, setLooking] = useState<string | null>(null);
  // During a session the phone opens on the Chronicle, so a note is one tap away.
  const [screenPick, setScreenPick] = useState<Screen>(view.map ? "map" : view.session ? "chronicle" : "purse");
  const setScreen = (s: Screen) => {
    setScreenPick(s);
    window.scrollTo({ top: 0 });
  };
  // The map tab exists while a map is on the TV, or once the party knows a map.
  const hasMaps = !!view.map || view.maps.length > 0;
  const screen = screenPick === "map" && !hasMaps ? (view.session ? "chronicle" : "purse") : screenPick;
  const seen = useDiscoverySeen(view);
  const [mode, setMode] = useState<ShopMode>("category");
  const [category, setCategory] = useState<ItemCategory | undefined>(undefined);
  const me = view.me;
  const availableCp = me.balanceCp - me.heldCp;
  /** Mags's tab only counts at her own storefront. */
  const availableAt = (shopId: string) => availableCp + (view.mine.credit.find((c) => c.shopId === shopId)?.limitCp ?? 0);
  // Keep the sheet in step with live changes (stock, price); close it if the item disappears.
  const lookingAt: PublicItem | undefined = looking ? view.items.find((i) => i.id === looking) : undefined;

  if (me.archived) {
    return (
      <Notice title={`Farewell, ${me.character ?? me.name}`}>
        <p>The DM has marked you as having left the table. Ask them to bring you back.</p>
      </Notice>
    );
  }

  const lock = () => setLocking(true);
  const lockWith = async (key: string): Promise<string | null> => {
    const err = await send({ type: "me.lock", key });
    if (err) return err;
    rememberKey(ident, key);
    setIdent({ ...ident, key });
    setLocking(false);
    setMsg("Your name is locked to this key. It's saved on this device.");
    return null;
  };

  return (
    <div className="player-root">
      {locking ? <LockSheet onLock={lockWith} onClose={() => setLocking(false)} /> : null}
      <header className="player-top pl-top">
        <button type="button" className="pl-who" aria-haspopup="dialog" aria-label={`${me.character ?? me.name}: your character, D&D Beyond link and name lock`} onClick={() => setYouOpen(true)}>
          <span className="player-name">{me.character ?? me.name}</span>
          <span className="pl-sub">
            <span className="renown-line-v" title={view.renown.meaning}>
              <span aria-hidden="true">❦ </span>
              <span className="sr-only">Party renown: </span>
              {view.renown.name}
            </span>
            <span aria-hidden="true">·</span>
            <span className="pl-sub-where">{view.session ? `Chapter ${view.session.number}, tonight` : view.game.name}</span>
          </span>
        </button>
        <button type="button" className="pl-coin" aria-haspopup="dialog" aria-label={`Your gold: ${formatCp(me.balanceCp)}. Open your purse.`} onClick={() => setWalletOpen("purse")}>
          <span className="pl-coin-face" aria-hidden="true" />
          <span className="pl-coin-amt">{coinLabel(me.balanceCp)}</span>
          {me.heldCp ? <span className="pl-coin-held" aria-hidden="true" /> : null}
        </button>
      </header>
      {!online ? (
        <p className="player-offline pl-offline" role="status">
          Reconnecting&hellip;
        </p>
      ) : null}
      <DecisionBanners view={view} />
      {view.fight ? <FightCard view={view} send={send} /> : null}
      <BannerToast banner={view.banner} className="phone-banner" />
      <PlayerNav
        screen={screen}
        onScreen={setScreen}
        hasMaps={hasMaps}
        discoverCount={seen.newCount}
        jobsCount={view.jobs.filter((j) => j.canTake && !j.asked).length}
      />
      <button type="button" className="pl-fab" aria-label="Roll dice" aria-haspopup="dialog" onClick={() => setDiceOpen(true)}>
        {NAV_ICONS.d20}
      </button>
      {diceOpen ? (
        <Sheet title="Dice" onClose={() => setDiceOpen(false)} className="pl-dice-sheet">
          <Dice view={view} send={send} />
        </Sheet>
      ) : null}
      {walletOpen ? (
        <Sheet title={walletOpen === "send" ? "Send gold" : "Your purse"} onClose={() => setWalletOpen(false)} className="pl-wallet-sheet">
          <div className="pl-wallet-big" aria-label={`Your gold: ${formatCp(me.balanceCp)}`}>
            {formatCp(me.balanceCp)}
          </div>
          <p className={`pl-wallet-avail${me.heldCp ? " held" : ""}`}>
            {me.heldCp ? (
              <>
                <span className="purse-amt">{formatCp(availableCp)}</span> available · {formatCp(me.heldCp)} held for your asks
              </>
            ) : (
              "All of it is yours to spend"
            )}
          </p>
          <h3 className="pl-sheet-sub">Party purse</h3>
          <ul className="purse-list" id="party-purse">
            {view.purse.map((p) => (
              <li key={p.id} className={p.id === me.id ? "me" : undefined}>
                <span>
                  {p.inspired ? <InspirationIcon size={18} className="insp" role="img" aria-hidden={false} aria-label="Heroic Inspiration" /> : null}
                  {p.name}
                </span>
                <span className="purse-amt">{formatCp(p.balanceCp)}</span>
              </li>
            ))}
            <li className="pl-purse-total">
              <span>Party total</span>
              <span className="purse-amt">{formatCp(view.purse.reduce((a, p) => a + p.balanceCp, 0))}</span>
            </li>
          </ul>
          <SendGold view={view} availableCp={availableCp} send={send} startOpen={walletOpen === "send"} onMsg={(m) => (setMsg(m), setWalletOpen(false), setScreen("purse"))} />
          {screen !== "purse" ? (
            <button type="button" className="btn big" onClick={() => (setWalletOpen(false), setScreen("purse"))}>
              Shops and your history
            </button>
          ) : null}
        </Sheet>
      ) : null}
      {screen === "map" && hasMaps ? <Maps view={view} send={send} /> : null}
      {screen === "chronicle" ? <Chronicle view={view.chronicle} gameName={view.game.name} send={send} /> : null}
      {screen === "jobs" ? <Jobs view={view} send={send} /> : null}
      {screen === "discovery" ? <Discovery view={view} send={send} seen={seen} /> : null}
      {screen === "purse" ? (
        <>
          {me.balanceCp < 0 && view.mine.credit.length ? (
            <p className="note owe-note" role="status">
              You owe {formatCp(-me.balanceCp)} on your tab at {view.mine.credit.map((c) => c.shopName).join(" and ")}. Pay it off before Mags remembers.
            </p>
          ) : null}
          {msg ? (
            <p className="player-msg pl-msg" role="status">
              {msg}
            </p>
          ) : null}

          <section className="pl-wallet" aria-label="Your purse">
            <div className="pl-wallet-lbl">Your purse</div>
            <div className="pl-wallet-big">{formatCp(me.balanceCp)}</div>
            <p className={`pl-wallet-avail${me.heldCp ? " held" : ""}`}>
              {me.heldCp ? (
                <>
                  <span className="purse-amt">{formatCp(availableCp)}</span> to spend · {formatCp(me.heldCp)} held for your asks
                </>
              ) : (
                "All of it is yours to spend"
              )}
            </p>
            <div className="pl-wallet-acts">
              <button type="button" className="btn" onClick={() => setWalletOpen("purse")}>
                Party purse
              </button>
              {view.table.length ? (
                <button type="button" className="btn" onClick={() => setWalletOpen("send")}>
                  Send gold
                </button>
              ) : null}
              <button type="button" className="btn" onClick={() => setHistoryOpen(true)}>
                History
              </button>
            </div>
          </section>

          <MyRequests requests={view.myRequests} send={send} onMsg={setMsg} />

          {view.shops.length ? (
            <Market
              view={view}
              shopId={shopId ?? ""}
              onShop={setShopId}
              mode={mode}
              onMode={setMode}
              category={category}
              onCategory={setCategory}
              availableFor={(it) => (it.kind === "project" ? availableCp : availableAt(it.shopId))}
              onOpen={setLooking}
              footer={
                <p className="pl-hint">
                  Tap anything to see it and ask the DM. Asking holds the gold until they say yes; you can cancel while it&rsquo;s waiting.
                  {!me.locked ? (
                    <>
                      {" "}
                      Anyone with your link can ask to spend your gold, so{" "}
                      <button type="button" className="linkish" onClick={lock}>
                        lock your name
                      </button>
                      .
                    </>
                  ) : null}
                </p>
              }
            />
          ) : (
            <section className="pl-market">
              <div className="pl-sec-head">
                <h2>The market</h2>
              </div>
              <div className="pl-empty">
                <p>No shops are open to you yet. Keep your eyes open.</p>
              </div>
            </section>
          )}

          {lookingAt ? (
            <RequestSheet
              item={lookingAt}
              availableCp={lookingAt.kind === "project" ? availableCp : availableAt(lookingAt.shopId)}
              send={send}
              onClose={() => setLooking(null)}
              onDone={(m) => {
                setLooking(null);
                setMsg(m);
              }}
            />
          ) : null}

          <Yours view={view} send={send} onMsg={setMsg} />

          {pendingOrders.length ? (
            <section className="box">
              <h2>On its way</h2>
              <ul className="ledger">
                {pendingOrders.map((o) => (
                  <li key={o.id}>
                    <span>{o.itemName}</span>
                    <span className="note">arrives at session {o.arrivesAtSession}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <button type="button" className="pl-row-link" onClick={() => setYouOpen(true)}>
            <span>
              <b>Your character</b>
              <span>D&amp;D Beyond{view.vttUrl ? ", the VTT" : ""} and your name lock</span>
            </span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </>
      ) : null}

      {historyOpen ? (
        <Sheet title="Your history" onClose={() => setHistoryOpen(false)}>
          <ul className="ledger">
            {view.myLedger.length === 0 ? (
              <li>
                <span className="note">No gold has changed hands yet.</span>
              </li>
            ) : null}
            {view.myLedger.map((l) => (
              <li key={l.id}>
                <span>
                  <div>{l.note}</div>
                  <div className="who">{new Date(l.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
                </span>
                <span className={l.amountCp >= 0 ? "up" : "down"}>{formatDelta(l.amountCp)}</span>
              </li>
            ))}
          </ul>
        </Sheet>
      ) : null}

      {youOpen ? (
        <Sheet title={me.character ?? me.name} onClose={() => setYouOpen(false)} className="pl-you-sheet">
          {me.character ? <p className="note pl-you-player">Played by {me.name}</p> : null}
          {view.vttUrl ? (
            <a className="btn primary big vtt-btn" href={view.vttUrl} target="_blank" rel="noopener noreferrer">
              Launch the VTT
            </a>
          ) : null}
          <CharacterLink current={me.dndbUrl} onSave={async (url) => setMsg((await send({ type: "me.update", patch: { dndbUrl: url } })) ?? "Saved.")} />
          <p className="note gold-note">Your gold lives here, not on D&amp;D Beyond: keep D&amp;D Beyond&rsquo;s coins at 0. Anything you buy, add to your D&amp;D Beyond inventory yourself.</p>
          {me.locked ? (
            <p className="pl-locked">
              <LockIcon size={16} /> Your name is locked
            </p>
          ) : (
            <button className="btn big" type="button" onClick={() => (setYouOpen(false), lock())}>
              <LockIcon size={18} /> Lock my name
            </button>
          )}
          {msg && youOpen ? (
            <p className="player-msg" role="status">
              {msg}
            </p>
          ) : null}
        </Sheet>
      ) : null}
    </div>
  );
}

/** What I have going: rentals, lessons, shares, titles and honours. */
function Yours({ view, send, onMsg }: { view: PlayerView; send: (c: object) => Promise<string | null>; onMsg: (m: string) => void }) {
  const { rentals, trainings, stakes, awards, credit } = view.mine;
  const [confirmSheet, ask] = useConfirm();
  if (!rentals.length && !trainings.length && !stakes.length && !awards.length && !credit.length) return null;
  return (
    <section className="box" aria-label="Yours">
      {confirmSheet}
      <h2>Yours</h2>
      <ul className="mine-list">
        {awards.map((a) => (
          <li key={a.id}>
            <span>
              <span className="earned-badge">Earned</span> <b>{a.itemName}</b>
              {a.note ? <span className="note"> · {a.note}</span> : null}
            </span>
          </li>
        ))}
        {stakes
          .filter((k) => !k.project)
          .map((k) => (
            <li key={k.itemId}>
              <b>{k.itemName}</b>
            </li>
          ))}
        {rentals.map((r) => (
          <li key={r.id}>
            <span>
              <b>{r.itemName}</b> <span className="note">· {formatCp(r.monthlyCp)} at the end of each session</span>
            </span>
            <button
              type="button"
              className="btn small"
              onClick={async () => {
                if (!(await ask({ title: `Give up ${r.itemName}?`, body: "Rent stops from now on.", yes: "Give it up", no: "Keep it", danger: true }))) return;
                onMsg((await send({ type: "me.cancelRental", rentalId: r.id })) ?? `You gave up ${r.itemName}.`);
              }}
            >
              Cancel
            </button>
          </li>
        ))}
        {trainings.map((t) => (
          <li key={t.id}>
            <span>
              <b>{t.itemName}</b>
              {t.what ? ` (${t.what})` : ""} <span className="note">· {t.done ? "finished!" : `${t.paid} of ${t.of} lessons paid`}</span>
            </span>
          </li>
        ))}
        {stakes
          .filter((k) => k.project)
          .map((k) => (
            <li key={k.itemId}>
              <span>
                <b>{k.itemName}</b> <span className="note">· you put in {formatCp(k.cp)}</span>
              </span>
              <span className="note">{k.funded ? "Funded!" : `${formatCp(k.raisedCp ?? 0)} of ${formatCp(k.goalCp ?? 0)}`}</span>
            </li>
          ))}
        {credit.map((c) => (
          <li key={c.shopId}>
            <span>
              <b>A tab at {c.shopName}</b> <span className="note">· up to {formatCp(c.limitCp)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CharacterLink({ current, onSave }: { current?: string; onSave: (url: string) => void }) {
  const [v, setV] = useState(current ?? "");
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v.trim());
      }}
    >
      {current ? (
        <a className="btn primary big" href={current} target="_blank" rel="noopener noreferrer">
          Open my character on D&amp;D Beyond
        </a>
      ) : null}
      <label>
        D&amp;D Beyond link
        <input className="fld" type="url" inputMode="url" value={v} onChange={(e) => setV(e.target.value)} placeholder="https://www.dndbeyond.com/characters/..." />
      </label>
      <button className="btn" type="submit">
        Save link
      </button>
    </form>
  );
}

/** Pick a key that locks this name, so only this player can spend from it. */
function LockSheet({ onLock, onClose }: { onLock: (key: string) => Promise<string | null>; onClose: () => void }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title="Lock your name" onClose={onClose}>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (key.trim().length < 4) return setErr("Keys need at least 4 characters.");
          setBusy(true);
          setErr(await onLock(key.trim()));
          setBusy(false);
        }}
      >
        <p className="note">Pick a key. Only someone with it can open your name and ask to spend your gold. You&rsquo;ll need it on any new phone or browser; this one remembers it.</p>
        <label>
          Your key
          <input className="fld" type="password" autoComplete="new-password" value={key} onChange={(e) => setKey(e.target.value)} autoFocus />
        </label>
        {err ? (
          <p className="error-text" role="alert">
            {err}
          </p>
        ) : null}
        <button type="submit" className="btn primary big" disabled={busy}>
          Lock my name
        </button>
      </form>
    </Sheet>
  );
}

/** The header's coin: whole gold pieces once there are any, so a long purse never squeezes the name. The sheet shows it all. */
function coinLabel(cp: number): string {
  return Math.abs(cp) >= 100 ? formatCp(cp - (cp % 100)) : formatCp(cp);
}
