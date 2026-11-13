"use client";

import { useState } from "react";
import { formatCp, formatDelta } from "@/shared/money";
import type { PlayerView } from "@/shared/projection";
import { hrefFor, rememberKey, type Ident } from "../api";
import { useGame } from "../useGame";
import { Notice } from "../ui/Notice";
import { ShopBoard } from "../ui/ShopBoard";
import { BannerToast } from "../ui/BannerToast";
import { InspirationIcon, LockIcon } from "../ui/icons";

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
  const me = view.me;

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
        </div>
        <div className="player-gold" aria-label={`Your gold: ${formatCp(me.balanceCp)}`}>
          {formatCp(me.balanceCp)}
        </div>
      </header>
      <p className="note gold-note">Your gold lives here, not on D&amp;D Beyond: keep D&amp;D Beyond&rsquo;s coins at 0. Anything you buy, add to your D&amp;D Beyond inventory yourself.</p>
      {!online ? (
        <p className="player-offline" role="status">
          Reconnecting&hellip;
        </p>
      ) : null}
      {msg ? (
        <p className="player-msg" role="status">
          {msg}
        </p>
      ) : null}

      <section className="box">
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
      </section>

      <BannerToast banner={view.banner} className="phone-banner" />

      <section className="box">
        {view.shops.length ? (
          <>
            <ShopBoard shops={view.shops} items={view.items} shopId={shopId ?? ""} onShop={setShopId} size="page" />
            <p className="note">To buy something, ask the DM. (Buying from your phone is coming soon.)</p>
          </>
        ) : (
          <>
            <h2>The market</h2>
            <p className="note">No shops are open to you yet. Keep your eyes open around town.</p>
          </>
        )}
      </section>

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
    </div>
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
