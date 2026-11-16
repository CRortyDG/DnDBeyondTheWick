import { useCallback, useEffect, useRef, useState } from "react";
import { calendarFile, googleCalendarLink, timeText, type InviteView } from "@/shared/invites";

const SEAT_HEADER = "x-candlefair-seat";
const KEY_HEADER = "x-candlefair-key";

function get(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function set(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

/** A random key this phone keeps for its seat. Only its hash goes to the server's records. */
function newKey(): string | null {
  try {
    const b = new Uint8Array(24);
    crypto.getRandomValues(b);
    return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return null;
  }
}

/** A player sign-in saved on this phone by the main app (cf-key:<game>:<player>), so someone who already plays here claims in one tap. */
function savedSignIn(game: string): { player: string; key: string } | null {
  try {
    const prefix = `cf-key:${game}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(prefix)) continue;
      const player = k.slice(prefix.length);
      if (!player || player === "dm" || player === "tv") continue;
      const key = localStorage.getItem(k);
      if (key) return { player, key };
    }
  } catch {}
  return null;
}

function longDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return isNaN(+d) ? date : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

/** "6:30 to about 10:30 PM". */
function hours(v: InviteView["invite"]): string {
  const start = timeText(v.time);
  if (!v.endTime) return start;
  const end = timeText(v.endTime);
  const same = start.slice(-2) === end.slice(-2);
  return `${same ? start.slice(0, -3) : start} to about ${end}`;
}

function Candles({ lit, total }: { lit: number; total: number }) {
  return (
    <span className="inv-candles" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < lit ? "lit" : ""} />
      ))}
    </span>
  );
}

export function InviteApp({ code, game }: { code: string | null; game: string }) {
  const seatSlot = `cf-invite:${game}:${code ?? ""}`;
  const [seatKey, setSeatKey] = useState<string | null>(() => (code ? get(seatSlot) : null));
  const signIn = useRef(savedSignIn(game));
  const [view, setView] = useState<InviteView | null>(null);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [character, setCharacter] = useState("");
  const [confirmDrop, setConfirmDrop] = useState(false);
  const [copied, setCopied] = useState(false);

  // Answers can arrive out of order (a poll that left before a claim): keep the newest, for this phone's current key.
  const versionRef = useRef(-1);
  const keyRef = useRef(seatKey);
  keyRef.current = seatKey;
  const call = useCallback(
    async (method: "GET" | "POST", body?: object, key = seatKey) => {
      const q = new URLSearchParams({ game, i: code ?? "" });
      if (signIn.current) q.set("player", signIn.current.player);
      const headers: Record<string, string> = {};
      if (key) headers[SEAT_HEADER] = key;
      if (signIn.current) headers[KEY_HEADER] = signIn.current.key;
      if (body) headers["Content-Type"] = "application/json";
      const res = await fetch(`/api/invite?${q}`, { method, headers, cache: "no-store", ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = (await res.json().catch(() => ({}))) as InviteView & { error?: string };
      if (res.status === 404 && method === "GET") {
        setGone(true);
        return null;
      }
      if (!res.ok) throw new Error(data.error || "That didn't work. Try again in a moment.");
      if (method === "GET" && (data.version < versionRef.current || key !== keyRef.current)) return data;
      versionRef.current = Math.max(versionRef.current, data.version);
      setView(data);
      return data;
    },
    [code, game, seatKey],
  );

  useEffect(() => {
    if (!code) {
      setGone(true);
      return;
    }
    void call("GET").catch(() => undefined);
    // Keep an eye out for a seat opening, but only while the page is being looked at.
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void call("GET").catch(() => undefined);
    }, 30_000);
    const back = () => document.visibilityState === "visible" && void call("GET").catch(() => undefined);
    document.addEventListener("visibilitychange", back);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", back);
    };
  }, [call, code]);

  // A seat this phone holds signs it in as that player: save the key where the main app looks for it.
  const me = view?.me;
  const handle = me?.tableHref ? new URLSearchParams(me.tableHref.split("#")[0].replace(/^\/\?/, "")).get("player") : null;
  useEffect(() => {
    if (me?.seatSignsIn && handle && seatKey) set(`cf-key:${game}:${handle.toLowerCase()}`, seatKey);
  }, [me?.seatSignsIn, handle, seatKey, game]);

  const claim = async () => {
    setError(null);
    let key = seatKey;
    if (!key) {
      key = newKey();
      if (!key) {
        setError("This browser can't keep a seat. Try opening the link in Safari or Chrome.");
        return;
      }
      set(seatSlot, key);
      keyRef.current = key;
      setSeatKey(key);
    }
    setBusy(true);
    try {
      await call("POST", { type: "claim", name: name.trim(), character: character.trim() }, key);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const drop = async () => {
    setError(null);
    setBusy(true);
    try {
      await call("POST", { type: "drop" });
      setConfirmDrop(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (gone) {
    return (
      <main className="inv inv-gone">
        <h1>This invite link doesn&rsquo;t work</h1>
        <p>It may have been mistyped or deleted. Ask whoever sent it for a new one.</p>
      </main>
    );
  }
  if (!view) return <main className="inv inv-loading" aria-busy="true" />;

  const v = view.invite;
  const pageUrl = window.location.origin + window.location.pathname + window.location.search;
  const where = me?.address ? `${me.address}${v.place ? ` (${v.place})` : ""}` : v.place;
  const left = Math.max(0, v.seats - v.taken);
  const tableHref = me?.tableHref ? me.tableHref + (me.seatSignsIn && seatKey && !me.tableHref.includes("#") ? `#key=${encodeURIComponent(seatKey)}` : "") : null;
  const kicker =
    v.status === "cancelled" ? "Cancelled" : me?.state === "in" ? (me.movedUp ? "A seat opened up" : "You're in") : me?.state === "wait" || v.status === "full" ? "Table's full" : v.status === "started" ? "Game on" : "You're invited";
  const canClaim = (v.status === "open" || (v.status === "full" && v.waitlist)) && (!me || me.state === "out");

  const saveCalendar = () => {
    const blob = new Blob([calendarFile(v, pageUrl, where)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${v.title.replace(/[^\w -]+/g, "").trim() || "game-night"}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const share = async () => {
    const text = `${v.title}: ${longDate(v.date)} at ${timeText(v.time)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: v.title, text, url: pageUrl });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <main className={`inv state-${me?.state ?? "none"} status-${v.status}`}>
      <div className={`inv-hero${me ? " short" : ""}`}>
        <img src={v.art || "/arrival/og-table.jpg"} alt="" />
        <span className="inv-kick">{kicker}</span>
      </div>
      <div className="inv-body">
        <h1>{v.title}</h1>
        <p className="inv-meta">
          <b>{longDate(v.date)}</b> &middot; {hours(v)}
          {v.place ? (
            <>
              <br />
              {v.place}
            </>
          ) : null}
        </p>
        {v.party ? <p className="inv-party">For {v.party}</p> : null}

        {v.status === "cancelled" ? (
          <section className="inv-card">
            <div className="big">This game is cancelled.</div>
            <p>Sorry! Keep an eye out for the next one.</p>
          </section>
        ) : null}

        {me?.state === "in" && v.status !== "cancelled" ? (
          <>
            <section className="inv-card got">
              <div className="big">{me.movedUp ? "You're in! A seat opened up." : `Your seat is saved, ${me.name.split(/\s+/)[0]}.`}</div>
              <p>
                {me.held ? "The DM saved this seat for you. " : ""}
                {me.seatSignsIn || me.tableHref ? "On the night, this phone opens straight to your table." : ""}
              </p>
              {where ? (
                <div className="inv-addr">
                  <span aria-hidden="true">📍</span>
                  <div>
                    <b>{me.address ?? v.place}</b>
                    <br />
                    <span className="dim">
                      {longDate(v.date)} &middot; {timeText(v.time)}
                    </span>
                  </div>
                </div>
              ) : null}
            </section>
            {v.status === "started" && tableHref ? (
              <a className="inv-cta" href={tableHref}>
                Go to your table
              </a>
            ) : me.arrivalHref ? (
              <a className="inv-cta" href={me.arrivalHref}>
                Make your character
              </a>
            ) : tableHref ? (
              <a className="inv-cta" href={tableHref}>
                Go to your table
              </a>
            ) : null}
            <div className="inv-two">
              <button className="inv-cta ghost" type="button" onClick={saveCalendar}>
                Add to calendar
              </button>
              <button className="inv-cta ghost" type="button" onClick={() => void share()}>
                {copied ? "Link copied" : "Share"}
              </button>
            </div>
            <p className="inv-gcal">
              <a href={googleCalendarLink(v, pageUrl, where)} target="_blank" rel="noreferrer">
                Or add it to Google Calendar
              </a>
            </p>
          </>
        ) : null}

        {me?.state === "wait" && v.status !== "cancelled" ? (
          <section className="inv-card wait">
            <div className="big">You&rsquo;re number {me.place ?? 1} on the waitlist.</div>
            <p>If someone gives their seat back, the first person in line moves up on their own. Open this link again to check, and the DM will message you if you get in.</p>
          </section>
        ) : null}

        {me?.state === "ask" && v.status !== "cancelled" ? (
          <section className="inv-card wait">
            <div className="big">Asked! Waiting for the DM&rsquo;s OK.</div>
            <p>The DM approves each seat for this one. Open this link again to check.</p>
          </section>
        ) : null}

        {me?.state === "removed" ? (
          <section className="inv-card">
            <div className="big">The DM took you off this one.</div>
            <p>Ask them if that&rsquo;s a mistake.</p>
          </section>
        ) : null}

        {me?.state === "out" ? (
          <section className="inv-card">
            <div className="big">You gave your seat back.</div>
            <p>Thanks for letting the next person in.{canClaim ? " Changed your mind? You can claim again below." : ""}</p>
          </section>
        ) : null}

        {v.status !== "cancelled" ? (
          <>
            {!me && v.blurb ? <p className="inv-blurb">{v.blurb}</p> : null}
            <div className="inv-seats">
              <Candles lit={v.taken} total={v.seats} />
              <span>
                {v.status === "started"
                  ? "The game is on"
                  : left > 0
                    ? `${left} of ${v.seats} seat${v.seats === 1 ? "" : "s"} left`
                    : `All ${v.seats} seats taken${v.waiting ? ` · ${v.waiting} waiting` : ""}`}
              </span>
            </div>
            {v.who?.length ? <p className="inv-who">Coming: {v.who.join(", ")}</p> : null}
          </>
        ) : null}

        {canClaim ? (
          <form
            className="inv-form"
            onSubmit={(e) => {
              e.preventDefault();
              void claim();
            }}
          >
            {view.known ? (
              <p className="inv-known">
                Signed in on this phone as <b>{view.known.character ? `${view.known.character} (${view.known.name})` : view.known.name}</b>.
              </p>
            ) : (
              <>
                <label className="sr-only" htmlFor="inv-name">
                  Your name
                </label>
                <input id="inv-name" className="inv-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="given-name" maxLength={32} required />
                <label className="sr-only" htmlFor="inv-char">
                  Character name (optional)
                </label>
                <input id="inv-char" className="inv-field" value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="Character name (optional)" maxLength={40} />
              </>
            )}
            <button className="inv-cta" type="submit" disabled={busy || (!view.known && !name.trim())}>
              {busy ? "Saving your seat…" : v.approve ? "Ask for a seat" : v.status === "full" ? "Join the waitlist" : "Claim a seat"}
            </button>
            <p className="inv-small">{v.status === "full" ? "If a seat opens, the first in line moves up." : v.approve ? "The DM approves each seat." : "First come, first served. You can give it back any time."}</p>
          </form>
        ) : null}

        {!me && !canClaim && v.status === "closed" ? <p className="inv-small">Seats aren&rsquo;t being claimed any more. Ask the DM.</p> : null}
        {!me && !canClaim && v.status === "full" && !v.waitlist ? <p className="inv-small">Every seat is taken. Ask the DM about the next one.</p> : null}

        {error ? (
          <p className="inv-error" role="alert">
            {error}
          </p>
        ) : null}

        {(me?.state === "in" || me?.state === "wait" || me?.state === "ask") && v.status !== "cancelled" && v.status !== "started" ? (
          confirmDrop ? (
            <div className="inv-confirm">
              <p>{me.state === "in" ? "Give your seat back? The next person in line gets it." : "Leave the waitlist?"}</p>
              <div className="inv-two">
                <button className="inv-cta ghost" type="button" onClick={() => setConfirmDrop(false)}>
                  Keep it
                </button>
                <button className="inv-cta danger" type="button" disabled={busy} onClick={() => void drop()}>
                  {me.state === "in" ? "Give it back" : "Leave"}
                </button>
              </div>
            </div>
          ) : (
            <button className="inv-link" type="button" onClick={() => setConfirmDrop(true)}>
              {me.state === "in" ? "Can't make it? Give your seat back" : me.state === "wait" ? "Leave the waitlist" : "Never mind"}
            </button>
          )
        ) : null}

        {me?.state === "wait" ? (
          <button className="inv-cta ghost" type="button" onClick={saveCalendar}>
            Add to calendar, just in case
          </button>
        ) : null}

        <p className="inv-foot">{v.campaign}</p>
      </div>
    </main>
  );
}
