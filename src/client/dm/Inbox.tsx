"use client";

// The DM's request inbox: purchases and gold transfers asked for from phones.
// <Inbox /> is self-contained (badge, chime, drawer, the I key), so the run-game
// sheet can mount it as well as the DM view.

import { useCallback, useEffect, useRef, useState } from "react";
import { formatCp, parseAmount } from "@/shared/money";
import { pendingRequests } from "@/shared/requests";
import type { TradeRequest } from "@/shared/types";
import { useDm } from "./context";

const MUTE_SLOT = "cf-inbox-muted";

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_SLOT) === "1";
  } catch {
    return false;
  }
}
function writeMuted(v: boolean) {
  try {
    localStorage.setItem(MUTE_SLOT, v ? "1" : "0");
  } catch {}
}

/** Two soft notes. Browsers only allow sound after the page has been clicked once. */
function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ac = new Ctx();
    const t = ac.currentTime;
    [880, 1318.5].forEach((f, i) => {
      const o = ac.createOscillator();
      const gain = ac.createGain();
      o.type = "sine";
      o.frequency.value = f;
      gain.gain.setValueAtTime(0, t + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.06, t + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.5);
      o.connect(gain).connect(ac.destination);
      o.start(t + i * 0.12);
      o.stop(t + i * 0.12 + 0.55);
    });
    setTimeout(() => void ac.close(), 1200);
  } catch {}
}

/** Is the inbox drawer open? The run-game sheet checks this before handling Esc. */
export function isInboxOpen(): boolean {
  return typeof document !== "undefined" && !!document.querySelector(".inbox-drawer");
}

export function Inbox() {
  const { view } = useDm();
  const pending = pendingRequests(view.state);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(readMuted()), []);

  // Chime when a new request arrives (never for the ones already waiting on load).
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ids = new Set(pending.map((r) => r.id));
    const before = seen.current;
    seen.current = ids;
    if (!before || muted) return;
    if ([...ids].some((id) => !before.has(id))) chime();
  }, [pending, muted]);

  // I opens and closes the inbox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button type="button" className={`btn inbox-btn${pending.length ? " has" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label={`Requests: ${pending.length} waiting`}>
        <span className="key">I</span> Requests
        {pending.length ? <span className="badge">{pending.length}</span> : null}
      </button>
      {open ? (
        <InboxDrawer
          pending={pending}
          muted={muted}
          onMute={() => {
            writeMuted(!muted);
            setMuted(!muted);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function InboxDrawer({ pending, muted, onMute, onClose }: { pending: TradeRequest[]; muted: boolean; onMute: () => void; onClose: () => void }) {
  const { view, run, call, toast } = useDm();
  const s = view.state;
  const recent = s.requests.filter((r) => r.status !== "pending").slice(-6).reverse();
  const panel = useRef<HTMLDivElement>(null);

  // Esc closes the drawer first, before the DM view (or run sheet) sees it.
  useEffect(() => {
    panel.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", esc, true);
    return () => window.removeEventListener("keydown", esc, true);
  }, [onClose]);

  const approveAll = async () => {
    const r = await call({ type: "request.approveAll" });
    toast(r.error ?? r.info ?? "Approved.");
  };

  return (
    <div className="inbox-backdrop" onClick={onClose}>
      <aside className="inbox-drawer" role="dialog" aria-label="Requests from phones" tabIndex={-1} ref={panel} onClick={(e) => e.stopPropagation()}>
        <div className="box-head">
          <h2>Requests</h2>
          <button type="button" className="btn small" onClick={onClose}>
            Close <span className="key">Esc</span>
          </button>
        </div>
        <div className="inline inbox-settings">
          <label className="check">
            <input type="checkbox" checked={!muted} onChange={onMute} /> Chime
          </label>
          <label className="check">
            <input type="checkbox" checked={s.tvPurchases !== false} onChange={(e) => run({ type: "game.tvPurchases", on: e.target.checked })} /> Show purchases on the TV
          </label>
        </div>
        {pending.length > 1 ? (
          <button type="button" className="btn primary big" onClick={approveAll}>
            Approve all {pending.length}
          </button>
        ) : null}
        {pending.length === 0 ? <p className="note">Nothing waiting. Requests from phones show up here.</p> : null}
        <ul className="inbox-list">
          {pending.map((r) => (
            <RequestRow key={r.id} r={r} />
          ))}
        </ul>
        {recent.length ? (
          <>
            <h3>Recently</h3>
            <ul className="inbox-recent">
              {recent.map((r) => (
                <li key={r.id}>
                  <span>
                    {r.playerName}: {describe(r)}
                  </span>
                  <span className={`req-status st-${r.status}`}>
                    {r.status}
                    {r.chargedCp !== undefined && r.kind === "buy" ? ` · ${formatCp(r.chargedCp)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </aside>
    </div>
  );
}

function describe(r: TradeRequest): string {
  if (r.kind === "give") return `send ${formatCp(r.totalCp)} to ${r.toPlayerName}`;
  return `${r.qty > 1 ? `${r.qty} × ` : ""}${r.itemName}`;
}

function RequestRow({ r }: { r: TradeRequest }) {
  const { view, call, toast } = useDm();
  const s = view.state;
  const p = s.players.find((x) => x.id === r.playerId);
  const item = r.itemId ? s.items.find((x) => x.id === r.itemId) : undefined;
  const shop = item ? s.shops.find((x) => x.id === item.shopId) : undefined;
  const [mode, setMode] = useState<"idle" | "decline" | "price">("idle");
  const [reason, setReason] = useState("");
  const [price, setPrice] = useState("");
  const [problem, setProblem] = useState<{ msg: string; totalCp?: number } | null>(null);

  const approve = useCallback(
    async (totalCp?: number, override = false) => {
      const res = await call({ type: "request.approve", requestId: r.id, ...(totalCp !== undefined ? { totalCp } : {}), ...(override ? { override: true } : {}) });
      if (res.code === "recheck") return setProblem({ msg: res.error ?? "", totalCp });
      if (res.error) return toast(res.error);
      toast(`Approved: ${r.playerName}, ${describe(r)}.`);
    },
    [call, r, toast],
  );
  const decline = async () => {
    const res = await call({ type: "request.decline", requestId: r.id, reason: reason.trim() });
    if (res.error) return toast(res.error);
    toast(`Declined: ${r.playerName}, ${describe(r)}.`);
  };

  const newTotal = parseAmount(price);
  const priceChanged = item && r.kind === "buy" && item.priceCp !== r.unitCp;

  return (
    <li className="inbox-req">
      <div className="inbox-who">
        <b>{r.playerName}</b>
        {r.secret ? <span className="tag wax">secret</span> : null}
        <span className="note">{new Date(r.at).toLocaleTimeString(undefined, { timeStyle: "short" })}</span>
      </div>
      <div className="inbox-what">
        {r.kind === "give" ? (
          <>
            Send <b className="purse-amt">{formatCp(r.totalCp)}</b> to <b>{r.toPlayerName}</b>
          </>
        ) : (
          <>
            {r.qty > 1 ? `${r.qty} × ` : ""}
            <b>{r.itemName}</b>
            {shop ? <span className="note"> at {shop.name}</span> : null} for <b className="purse-amt">{formatCp(r.totalCp)}</b>
            {r.qty > 1 ? <span className="note"> ({formatCp(r.unitCp)} each)</span> : null}
          </>
        )}
      </div>
      <div className="note">
        {p ? (
          <>
            {p.name} has <span className="purse-amt">{formatCp(p.balanceCp)}</span>
          </>
        ) : (
          "That player is no longer at the table."
        )}
        {item && item.stock !== null ? ` · ${item.stock} in stock` : ""}
      </div>
      {priceChanged ? <div className="inbox-warn">The price is now {formatCp(item!.priceCp)} each. Approving charges what they saw, unless you set a price.</div> : null}
      {r.note ? <div className="inbox-note">&ldquo;{r.note}&rdquo;</div> : null}
      {item?.finePrint ? <div className="card-fine inbox-fine">{item.finePrint}</div> : null}

      {problem ? (
        <div className="inbox-problem" role="alert">
          <p>{problem.msg}</p>
          <div className="inline">
            <button type="button" className="btn danger" onClick={() => (setProblem(null), void approve(problem.totalCp, true))}>
              Approve anyway
            </button>
            <button type="button" className="btn" onClick={() => (setProblem(null), setMode("decline"))}>
              Decline
            </button>
            <button type="button" className="btn" onClick={() => setProblem(null)}>
              Not now
            </button>
          </div>
        </div>
      ) : mode === "decline" ? (
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            void decline();
          }}
        >
          <label className="grow">
            Reason the player sees (optional)
            <input className="fld" autoFocus value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="The smith won't sell to you after last night" />
          </label>
          <button type="submit" className="btn primary">
            Decline
          </button>
          <button type="button" className="btn" onClick={() => setMode("idle")}>
            Back
          </button>
        </form>
      ) : mode === "price" ? (
        <form
          className="inline"
          onSubmit={(e) => {
            e.preventDefault();
            if (newTotal === null) return toast("Enter the new total, like 8 or 7 gp 5 sp.");
            void approve(newTotal);
          }}
        >
          <label className="grow">
            New total (was {formatCp(r.totalCp)})
            <input className="fld amt" autoFocus inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="8" />
          </label>
          <button type="submit" className="btn primary" disabled={newTotal === null}>
            Approve at {newTotal === null ? "…" : formatCp(newTotal)}
          </button>
          <button type="button" className="btn" onClick={() => setMode("idle")}>
            Back
          </button>
        </form>
      ) : (
        <div className="inline">
          <button type="button" className="btn primary" onClick={() => void approve()}>
            Approve
          </button>
          <button type="button" className="btn" onClick={() => setMode("decline")}>
            Decline
          </button>
          {r.kind === "buy" ? (
            <button type="button" className="btn" onClick={() => setMode("price")}>
              Different price
            </button>
          ) : null}
        </div>
      )}
    </li>
  );
}
