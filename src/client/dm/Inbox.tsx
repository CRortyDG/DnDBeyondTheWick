"use client";

// The DM's request inbox: purchases and gold transfers asked for from phones.
// <Inbox /> is self-contained (badge, chime, drawer, the I key), so the run-game
// sheet can mount it as well as the DM view.

import { useCallback, useEffect, useRef, useState } from "react";
import { formatCp, parseAmount } from "@/shared/money";
import { pendingRequests } from "@/shared/requests";
import { firstChargeCp } from "@/shared/progress";
import type { FlyerText, TradeRequest } from "@/shared/types";
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
  const openTasks = view.state.tasks.filter((t) => !t.done).length;
  const waiting = pending.length + openTasks;
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
      <button type="button" className={`btn inbox-btn${waiting ? " has" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label={`Requests: ${waiting} waiting`}>
        <span className="key">I</span> Requests
        {waiting ? <span className="badge">{waiting}</span> : null}
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
        {pending.length === 0 && !s.tasks.some((t) => !t.done) ? <p className="note">Nothing waiting. Requests from phones show up here.</p> : null}
        <ul className="inbox-list">
          {pending.map((r) => (
            <RequestRow key={r.id} r={r} />
          ))}
        </ul>
        <Tasks />
        <BoardFlyers />
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
  if (r.kind === "contribute") return `${formatCp(r.chargedCp ?? r.totalCp)} toward ${r.itemName}`;
  if (r.flyer) return `flyer “${r.flyer.title}”`;
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
  const service = item?.kind === "service";
  const [answer, setAnswer] = useState("");
  const [flyer, setFlyer] = useState<FlyerText>(r.flyer ?? { title: "", body: "", signedBy: "" });

  const approve = useCallback(
    async (totalCp?: number, override = false) => {
      const res = await call({
        type: "request.approve",
        requestId: r.id,
        ...(totalCp !== undefined ? { totalCp } : {}),
        ...(override ? { override: true } : {}),
        ...(answer.trim() ? { answer: answer.trim() } : {}),
        ...(r.flyer && flyer.title.trim() ? { flyer } : {}),
      });
      if (res.code === "recheck") return setProblem({ msg: res.error ?? "", totalCp });
      if (res.error) return toast(res.error);
      toast(`Approved: ${r.playerName}, ${describe(r)}.`);
    },
    [call, r, toast, answer, flyer],
  );
  const decline = async () => {
    const res = await call({ type: "request.decline", requestId: r.id, reason: reason.trim() });
    if (res.error) return toast(res.error);
    toast(`Declined: ${r.playerName}, ${describe(r)}.`);
  };

  const newTotal = parseAmount(price);
  const nowCp = item ? firstChargeCp(s, item) : 0;
  const priceChanged = item && r.kind === "buy" && nowCp !== r.unitCp;

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
        ) : r.kind === "contribute" ? (
          <>
            Put <b className="purse-amt">{formatCp(r.totalCp)}</b> toward <b>{r.itemName}</b>
            {item ? (
              <span className="note">
                {" "}
                ({formatCp(s.stakes.filter((k) => k.itemId === item.id).reduce((a, k) => a + k.cp, 0))} of {formatCp(item.priceCp)} so far)
              </span>
            ) : null}
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
      {priceChanged ? <div className="inbox-warn">The price is now {formatCp(nowCp)} each. Approving charges what they saw, unless you set a price.</div> : null}
      {r.question ? (
        <div className="inbox-note">
          {item?.prompt ? <span className="note">{item.prompt} </span> : null}&ldquo;{r.question}&rdquo;
        </div>
      ) : null}
      {r.note ? <div className="inbox-note">&ldquo;{r.note}&rdquo;</div> : null}
      {item?.finePrint ? <div className="card-fine inbox-fine">{item.finePrint}</div> : null}
      {item?.dmNote ? <div className="note">Your note: {item.dmNote}</div> : null}
      {service && r.flyer ? (
        <div className="form">
          <label>
            Flyer title
            <input className="fld" value={flyer.title} maxLength={60} onChange={(e) => setFlyer({ ...flyer, title: e.target.value })} />
          </label>
          <label>
            Lines
            <textarea className="fld" rows={3} value={flyer.body} maxLength={400} onChange={(e) => setFlyer({ ...flyer, body: e.target.value })} />
          </label>
          <label>
            Signed
            <input className="fld" value={flyer.signedBy} maxLength={60} onChange={(e) => setFlyer({ ...flyer, signedBy: e.target.value })} placeholder={r.playerName} />
          </label>
        </div>
      ) : service ? (
        <label>
          Your answer (they see it on their phone)
          <textarea className="fld" rows={2} value={answer} maxLength={600} onChange={(e) => setAnswer(e.target.value)} placeholder="Mags leans in: “The chef? Bought those recipes off a traveling merchant.”" />
        </label>
      ) : null}

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
            {r.flyer ? "Pin it up" : service ? (answer.trim() ? "Answer and charge" : "Done, charge it") : "Approve"}
          </button>
          <button type="button" className="btn" onClick={() => setMode("decline")}>
            Decline
          </button>
          {r.kind === "buy" && !r.flyer ? (
            <button type="button" className="btn" onClick={() => setMode("price")}>
              Different price
            </button>
          ) : null}
        </div>
      )}
    </li>
  );
}

/** Your to-do list: record a proficiency, a project funded. */
function Tasks() {
  const { view, run } = useDm();
  const open = view.state.tasks.filter((t) => !t.done);
  if (!open.length) return null;
  return (
    <>
      <h3>To do</h3>
      <ul className="inbox-list">
        {open.map((t) => (
          <li key={t.id} className="inbox-req inbox-task">
            <span>{t.text}</span>
            <button type="button" className="btn small primary" onClick={() => run({ type: "task.done", taskId: t.id, done: true })}>
              Done
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Player flyers: up on the TV notice board until you take them down. */
function BoardFlyers() {
  const { view, run } = useDm();
  const flyers = view.state.flyers;
  if (!flyers.length) return null;
  return (
    <>
      <h3>On the notice board</h3>
      <ul className="inbox-recent">
        {flyers
          .slice()
          .reverse()
          .map((f) => (
            <li key={f.id}>
              <span>
                <b>{f.title}</b> <span className="note">· {f.signedBy}</span>
              </span>
              <span className="inline">
                <button type="button" className="btn small" onClick={() => run({ type: "flyer.update", flyerId: f.id, patch: { up: !f.up } })}>
                  {f.up ? "Take down" : "Put back up"}
                </button>
                {!f.up ? (
                  <button type="button" className="btn small danger" onClick={() => run({ type: "flyer.remove", flyerId: f.id })}>
                    Throw away
                  </button>
                ) : null}
              </span>
            </li>
          ))}
      </ul>
      {flyers.filter((f) => f.up).length > 8 ? <p className="note">The board shows the newest 8.</p> : null}
    </>
  );
}
