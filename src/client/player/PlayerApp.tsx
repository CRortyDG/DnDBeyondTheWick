"use client";

import { useState } from "react";
import { formatCp, formatDelta } from "@/shared/money";
import type { PlayerView, PublicItem } from "@/shared/projection";
import { hrefFor, rememberKey, type Ident } from "../api";
import { useGame } from "../useGame";
import { Notice } from "../ui/Notice";
import { ShopBoard, type ShopMode } from "../ui/ShopBoard";
import type { ItemCategory } from "@/shared/types";
import { Chronicle } from "../ui/Chronicle";
import { BannerToast } from "../ui/BannerToast";
import { InspirationIcon, LockIcon } from "../ui/icons";
import { Jobs } from "./Jobs";
import { FightCard } from "./FightCard";
import { askLabel, DecisionBanners, MyRequests, RequestSheet, SendGold, whyNot } from "./Requests";

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
  const [purseOpen, setPurseOpen] = useState(false);
  const [looking, setLooking] = useState<string | null>(null);
  // During a session the phone opens on the Chronicle, so a note is one tap away.
  const [screen, setScreen] = useState<"chronicle" | "purse" | "jobs">(view.session ? "chronicle" : "purse");
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
      <Notice title={`Farewell, ${me.name}`}>
        <p>The DM has marked you as having left the table. Ask them to bring you back.</p>
      </Notice>
    );
  }

  const lock = async () => {
    const key = prompt("Pick a key to lock your name. You'll need it on any new phone or browser.");
    if (!key || key.length < 4) return setMsg("Keys need at least 4 characters.");
    const err = await send({ type: "me.lock", key });
    if (err) return setMsg(err);
    rememberKey(ident, key);
    setIdent({ ...ident, key });
    setMsg("Your name is locked to this key. It's saved on this device.");
  };

  return (
    <div className="player-root">
      <header className="player-top">
        <div>
          <div className="player-hello">{view.game.name}</div>
          <h1 className="player-name">{me.name}</h1>
          <button type="button" className="renown-chip linkish" onClick={() => setScreen("jobs")} aria-label={`Party Renown: ${view.renown.name}. See the notice board.`}>
            Renown <b>{view.renown.name}</b>
          </button>
        </div>
        <div className="player-gold-wrap">
          <div className="player-gold" aria-label={`Your gold: ${formatCp(me.balanceCp)}`}>
            {formatCp(me.balanceCp)}
          </div>
          <div className={`player-avail${me.heldCp ? " held" : ""}`}>
            {me.heldCp ? (
              <>
                <span className="purse-amt">{formatCp(availableCp)}</span> available
              </>
            ) : (
              "all available"
            )}
          </div>
          <button type="button" className="btn small purse-btn" aria-expanded={purseOpen} aria-controls="party-purse" onClick={() => setPurseOpen((o) => !o)}>
            {purseOpen ? "Hide party purse" : "Party purse"}
          </button>
        </div>
      </header>
      <DecisionBanners view={view} />
      {view.fight ? <FightCard view={view} send={send} /> : null}
      <BannerToast banner={view.banner} className="phone-banner" />
      <div className="tabs player-screens" role="tablist" aria-label="Your page">
        <button type="button" role="tab" aria-selected={screen === "chronicle"} className={`btn tab${screen === "chronicle" ? " on" : ""}`} onClick={() => setScreen("chronicle")}>
          The Chronicle
        </button>
        <button type="button" role="tab" aria-selected={screen === "purse"} className={`btn tab${screen === "purse" ? " on" : ""}`} onClick={() => setScreen("purse")}>
          Gold &amp; shops
        </button>
        <button type="button" role="tab" aria-selected={screen === "jobs"} className={`btn tab${screen === "jobs" ? " on" : ""}`} onClick={() => setScreen("jobs")}>
          Jobs{view.jobs.some((j) => j.canTake && !j.asked) ? <span className="badge">{view.jobs.filter((j) => j.canTake && !j.asked).length}</span> : null}
        </button>
      </div>
      {!online ? (
        <p className="player-offline" role="status">
          Reconnecting&hellip;
        </p>
      ) : null}
      {screen === "chronicle" ? <Chronicle view={view.chronicle} gameName={view.game.name} send={send} /> : null}
      {screen === "jobs" ? <Jobs view={view} send={send} /> : null}
      {screen === "purse" ? (
      <>
      {me.balanceCp < 0 && view.mine.credit.length ? (
        <p className="note owe-note" role="status">
          You owe {formatCp(-me.balanceCp)} on your tab at {view.mine.credit.map((c) => c.shopName).join(" and ")}. Pay it off before Mags remembers.
        </p>
      ) : null}
      <p className="note gold-note">Your gold lives here, not on D&amp;D Beyond: keep D&amp;D Beyond&rsquo;s coins at 0. Anything you buy, add to your D&amp;D Beyond inventory yourself.</p>
      {msg ? (
        <p className="player-msg" role="status">
          {msg}
        </p>
      ) : null}

      {purseOpen ? (
      <section className="box" id="party-purse">
        <h2>Party purse</h2>
        <ul className="purse-list">
          {view.purse.map((p) => (
            <li key={p.id} className={p.id === me.id ? "me" : undefined}>
              <span>
                {p.inspired ? <InspirationIcon size={18} className="insp" role="img" aria-hidden={false} aria-label="Heroic Inspiration" /> : null}
                {p.name}
              </span>
              <span className="purse-amt">{formatCp(p.balanceCp)}</span>
            </li>
          ))}
        </ul>
        <p className="note">Party total: {formatCp(view.purse.reduce((a, p) => a + p.balanceCp, 0))}</p>
        <SendGold view={view} availableCp={availableCp} send={send} onMsg={setMsg} />
      </section>
      ) : null}

      <section className="box">
        {view.shops.length ? (
          <>
            <ShopBoard
              shops={view.shops}
              items={view.items}
              shopId={shopId ?? ""}
              onShop={setShopId}
              mode={mode}
              onMode={setMode}
              category={category}
              onCategory={setCategory}
              size="page"
              actions={(it) => {
                if (it.tier === "rumored" || it.kind === "earned") return null;
                const why = whyNot(it, it.kind === "project" ? availableCp : availableAt(it.shopId));
                return (
                  <>
                    <button type="button" className={`btn${why ? "" : " primary"} grow-btn`} onClick={() => setLooking(it.id)}>
                      {askLabel(it)}
                    </button>
                    {why && it.tier === "sale" && !it.funded ? <span className="card-why">{why}</span> : null}
                  </>
                );
              }}
            />
            <p className="note">Asking holds the gold until the DM approves or declines. You can cancel while it&rsquo;s waiting.</p>
            {!me.locked ? (
              <p className="note">
                Tip: anyone who opens your link can ask to spend your gold.{" "}
                <button type="button" className="linkish" onClick={lock}>
                  Lock your name
                </button>{" "}
                so only you can.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <h2>The market</h2>
            <p className="note">No shops are open to you yet. Keep your eyes open around town.</p>
          </>
        )}
      </section>

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

      <MyRequests requests={view.myRequests} send={send} onMsg={setMsg} />

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

      <section className="box">
        <h2>Your history</h2>
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
      </section>

      <section className="box">
        <h2>Your character</h2>
        {view.vttUrl ? (
          <a className="btn primary big vtt-btn" href={view.vttUrl} target="_blank" rel="noopener noreferrer">
            Launch the VTT
          </a>
        ) : null}
        <CharacterLink current={me.dndbUrl} onSave={async (url) => setMsg((await send({ type: "me.update", patch: { dndbUrl: url } })) ?? "Saved.")} />
        <div className="inline">
          {me.locked ? (
            <span className="tag">
              <LockIcon size={14} /> Your name is locked
            </span>
          ) : (
            <button className="btn" type="button" onClick={lock}>
              <LockIcon size={18} /> Lock my name
            </button>
          )}
        </div>
      </section>
      </>
      ) : null}
    </div>
  );
}

/** What I have going: rentals, lessons, shares, titles and honours. */
function Yours({ view, send, onMsg }: { view: PlayerView; send: (c: object) => Promise<string | null>; onMsg: (m: string) => void }) {
  const { rentals, trainings, stakes, awards, credit } = view.mine;
  if (!rentals.length && !trainings.length && !stakes.length && !awards.length && !credit.length) return null;
  return (
    <section className="box" aria-label="Yours">
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
                if (!confirm(`Give up ${r.itemName}? Rent stops from now on.`)) return;
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
