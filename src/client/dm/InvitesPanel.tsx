"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Invite, InviteEntry } from "@/shared/types";
import { asking, entryName, invitePath, inviteOver, invitesOf, inviteText, movedUpText, openSeats, reminderText, SEATS_MAX, seated, timeText, waiting, whenText } from "@/shared/invites";
import { partiesOf } from "@/shared/world";
import { storyOf } from "@/shared/story";
import { useDm } from "./context";
import { Drawer } from "./Drawer";
import { PageHead } from "./PageHead";
import { MenuItem, RowMenu } from "./RowMenu";
import { uploadImage } from "./upload";

const DAY = 24 * 3600_000;

/** "2026-11-22" "18:30" on this device's clock. */
function momentOf(date: string, time: string): number {
  const t = new Date(`${date}T${time}:00`).getTime();
  return isNaN(t) ? Date.now() : t;
}
function endOf(date: string, time: string, end: string): number | null {
  if (!end) return null;
  const t = momentOf(date, end);
  // Past midnight: the next day.
  return end < time ? t + DAY : t;
}
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function plusDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Closes = "start" | "2h" | "1d";

interface Draft {
  title: string;
  date: string;
  time: string;
  endTime: string;
  place: string;
  address: string;
  blurb: string;
  art: string;
  seats: number;
  waitlist: boolean;
  partyId: string;
  showWho: boolean;
  approve: boolean;
  closes: Closes;
  storyDateId: string;
}

function draftOf(inv?: Invite): Draft {
  if (!inv) return { title: "", date: plusDays(today(), 7), time: "18:30", endTime: "22:30", place: "", address: "", blurb: "", art: "", seats: 5, waitlist: true, partyId: "", showWho: true, approve: false, closes: "start", storyDateId: "" };
  const before = inv.closesAt ? inv.startsAt - inv.closesAt : 0;
  return {
    title: inv.title,
    date: inv.date,
    time: inv.time,
    endTime: inv.endTime ?? "",
    place: inv.place,
    address: inv.address ?? "",
    blurb: inv.blurb,
    art: inv.art ?? "",
    seats: inv.seats,
    waitlist: inv.waitlist,
    partyId: inv.partyId ?? "",
    showWho: inv.showWho,
    approve: inv.approve,
    closes: before >= DAY ? "1d" : before > 0 ? "2h" : "start",
    storyDateId: inv.storyDateId ?? "",
  };
}

function fieldsOf(d: Draft) {
  const startsAt = momentOf(d.date, d.time);
  return {
    title: d.title.trim(),
    date: d.date,
    time: d.time,
    endTime: d.endTime,
    startsAt,
    endsAt: endOf(d.date, d.time, d.endTime),
    place: d.place,
    address: d.address,
    blurb: d.blurb,
    art: d.art,
    seats: d.seats,
    waitlist: d.waitlist,
    partyId: d.partyId || null,
    showWho: d.showWho,
    approve: d.approve,
    closesAt: d.closes === "1d" ? startsAt - DAY : d.closes === "2h" ? startsAt - 2 * 3600_000 : null,
    storyDateId: d.storyDateId || null,
  };
}

function useLink() {
  const { view, toast, run } = useDm();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const linkOf = (inv: Invite) => origin + invitePath(view.state.id, inv.code);
  const copy = (text: string, msg: string, then?: () => void) =>
    void navigator.clipboard?.writeText(text).then(
      () => {
        toast(msg);
        then?.();
      },
      () => toast(text),
    );
  return { linkOf, copy, run };
}

/** Session invites: one link per game night, seats first come first served. */
export function InvitesPanel() {
  const { view } = useDm();
  const s = view.state;
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const now = Date.now();
  const list = invitesOf(s);
  // Just made one: open it once it arrives, so the DM can copy its text.
  const awaiting = useRef<number | null>(null);
  useEffect(() => {
    if (awaiting.current === null || list.length <= awaiting.current) return;
    awaiting.current = null;
    const newest = [...list].sort((a, b) => b.createdAt - a.createdAt)[0];
    if (newest) setOpen(newest.id);
  }, [list]);
  const upcoming = list.filter((x) => !inviteOver(x, now)).sort((a, b) => a.startsAt - b.startsAt);
  const past = list.filter((x) => inviteOver(x, now)).sort((a, b) => b.startsAt - a.startsAt);
  const editing = list.find((x) => x.id === open);
  const toTell = upcoming.reduce((n, x) => n + x.entries.filter((e) => e.state === "in" && e.movedUpAt && !e.told).length, 0);
  const asks = upcoming.reduce((n, x) => n + asking(x).length, 0);
  const next = upcoming[0];

  return (
    <div className="invites-panel pg">
      <PageHead
        title="Invites"
        sub="One link per game night. The first to claim get seats; the rest wait in line."
        help={
          <p>
            Make an invite, then send its link to your group chat or a few friends. Whoever opens it types a name and claims a seat. Once the seats are gone, later people join the waitlist. If someone taps &ldquo;Can&rsquo;t make it&rdquo;, the first person in line moves up on their own, until 2 hours before the start, when moving up is up to you. The app can&rsquo;t text anyone, so when someone moves up you&rsquo;ll see a <b>Copy message</b> button for them. A claimed seat is a real player: their phone opens straight to the table on the night, and their Arrival intro is ready. The address only shows to people with a seat. When you start the session, tick &ldquo;Seat tonight&rsquo;s invite&rdquo; and everyone with a seat is at the table.
          </p>
        }
        actions={
          <button className="btn primary" type="button" onClick={() => (setOpen(null), setCreating(true))}>
            New invite
          </button>
        }
        stats={[
          { label: "Next game", value: next ? `${whenText(next)}` : "None yet", tone: next ? "gold" : "muted" },
          ...(next ? [{ label: "Seats taken", value: `${seated(next).length} of ${next.seats}`, tone: openSeats(next) ? ("gold" as const) : ("ok" as const) }, { label: "Waiting", value: waiting(next).length, tone: "muted" as const }] : []),
          ...(toTell ? [{ label: "Moved up, not told", value: toTell, tone: "warn" as const }] : []),
          ...(asks ? [{ label: "Asking for a seat", value: asks, tone: "warn" as const }] : []),
        ]}
      />

      <ol className="scene-list pg-list">
        {upcoming.map((inv) => (
          <InviteRow key={inv.id} inv={inv} onOpen={() => (setCreating(false), setOpen(inv.id))} on={open === inv.id} />
        ))}
        {upcoming.length === 0 ? <li className="pg-empty">No game nights coming up. Make an invite and send the link.</li> : null}
      </ol>

      {past.length ? (
        <details className="invites-past">
          <summary>Past and cancelled ({past.length})</summary>
          <ol className="scene-list pg-list">
            {past.map((inv) => (
              <InviteRow key={inv.id} inv={inv} onOpen={() => (setCreating(false), setOpen(inv.id))} on={open === inv.id} />
            ))}
          </ol>
        </details>
      ) : null}

      {creating ? <InviteEditor onDone={(made) => (setCreating(false), (awaiting.current = made ? list.length : null))} /> : null}
      {editing && !creating ? <InviteEditor inv={editing} key={editing.id} onDone={() => setOpen(null)} /> : null}
    </div>
  );
}

function InviteRow({ inv, onOpen, on }: { inv: Invite; onOpen: () => void; on: boolean }) {
  const { linkOf, copy, run } = useLink();
  const ins = seated(inv).length;
  const wait = waiting(inv).length;
  const tell = inv.entries.filter((e) => e.state === "in" && e.movedUpAt && !e.told).length;
  const asks = asking(inv).length;
  const status = inv.status === "cancelled" ? "Cancelled" : inv.sessionId ? "Played" : inv.status === "closed" ? "Claims closed" : "";
  return (
    <li className={`scene-item list-row invite-row${on ? " on" : ""}${inv.status === "cancelled" ? " is-cancelled" : ""}`}>
      <div className="scene-row">
        {inv.art ? <img className="invite-thumb" src={inv.art} alt="" /> : <span className="invite-thumb blank" aria-hidden="true" />}
        <button className="row-main" type="button" onClick={onOpen}>
          <span className="row-title">{inv.title}</span>
          <span className="row-sub">
            {whenText(inv)}
            {inv.place ? ` · ${inv.place}` : ""}
            {status ? ` · ${status}` : ""}
          </span>
        </button>
        <span className="invite-count" title={`${ins} of ${inv.seats} seats taken${wait ? `, ${wait} waiting` : ""}`}>
          <b>
            {ins}/{inv.seats}
          </b>
          {wait ? <span className="note"> +{wait} waiting</span> : null}
        </span>
        {tell ? <span className="tag warn">{tell} to tell</span> : null}
        {asks ? <span className="tag warn">{asks} asking</span> : null}
        {!inviteOver(inv, Date.now()) ? (
          <button className="btn small" type="button" onClick={() => copy(inviteText(inv, linkOf(inv)), "Copied the invite text. Paste it in your group chat.")}>
            Copy invite
          </button>
        ) : null}
        <RowMenu label={inv.title}>
          <MenuItem onClick={onOpen}>Open</MenuItem>
          <MenuItem onClick={() => copy(linkOf(inv), "Copied the link.")}>Copy link</MenuItem>
          <MenuItem onClick={() => run({ type: "invite.remove", inviteId: inv.id }, `Deleted ${inv.title}.`)}>Delete</MenuItem>
        </RowMenu>
      </div>
    </li>
  );
}

function InviteEditor({ inv, onDone }: { inv?: Invite; onDone: (made?: boolean) => void }) {
  const { view, run, call, ident, toast } = useDm();
  const { linkOf, copy } = useLink();
  const s = view.state;
  const [d, setD] = useState<Draft>(() => draftOf(inv));
  const [hold, setHold] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const parties = partiesOf(s);
  const players = s.players.filter((p) => !p.archived);
  const episodes = s.episodes ?? [];
  const dates = storyOf(s).dates.filter((x) => !x.cancelled && !x.sessionId && x.date >= today());
  const art = useMemo(() => {
    const seen = new Set<string>();
    const out: { url: string; label: string }[] = [];
    for (const sc of s.scenes) {
      const url = sc.art?.url;
      if (url && (url.startsWith("/api/files/") || url.startsWith("/art/")) && !seen.has(url)) {
        seen.add(url);
        out.push({ url, label: sc.label || sc.name || "A scene" });
      }
    }
    if (s.arrival?.clip?.poster) out.unshift({ url: s.arrival.clip.poster, label: "Intro clip" });
    return out.slice(0, 24);
  }, [s.scenes, s.arrival]);
  const [picking, setPicking] = useState(false);

  const changed = JSON.stringify(d) !== JSON.stringify(draftOf(inv));
  const ok = !!d.title.trim() && !!d.date && !!d.time;

  const save = async () => {
    const f = fieldsOf(d);
    if (inv) {
      if (await run({ type: "invite.update", inviteId: inv.id, patch: f }, "Saved.")) setD(draftOf({ ...inv, ...f, partyId: f.partyId ?? undefined } as Invite));
      return;
    }
    const r = await call({ type: "invite.add", invite: f, ...(hold.length ? { holdIds: hold } : {}) });
    if (r.error) toast(r.error);
    else {
      toast("Invite made. Copy the invite text and send it.");
      onDone(true);
    }
  };

  const pickDate = (id: string) => {
    const sd = dates.find((x) => x.id === id);
    setD((x) => {
      const ep = sd?.episodeId ? episodes.find((e) => e.id === sd.episodeId) : undefined;
      return { ...x, storyDateId: id, ...(sd ? { date: sd.date } : {}), ...(ep && !x.title.trim() ? { title: ep.title } : {}) };
    });
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      set("art", await uploadImage(ident, file));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const link = inv ? linkOf(inv) : "";
  const preview = (
    <div className="invite-preview">
      <div className="invite-bubble">{inviteText({ ...(inv ?? ({} as Invite)), ...fieldsOf(d), title: d.title || "Game night" } as Invite, link || "…")}</div>
      <div className="invite-card">
        {d.art ? <img src={d.art} alt="" /> : <img src="/arrival/og-table.jpg" alt="" />}
        <div>
          <b>{d.title || "Game night"}</b>
          <span>
            {whenText({ date: d.date, time: d.time })} &middot; {d.seats} seats
          </span>
        </div>
      </div>
      <p className="note">The preview never shows the place or the address.</p>
    </div>
  );

  return (
    <Drawer title={inv ? inv.title : "New invite"} subtitle={inv ? `${whenText(inv)}${inv.status === "cancelled" ? " · Cancelled" : inv.sessionId ? " · Played" : ""}` : "One link for one game night"} onClose={() => onDone()} closeLabel={inv ? "Done" : "Cancel"} wide>
      <div className="invite-editor">
        {inv ? <InviteSeats inv={inv} /> : null}

        {inv && !inv.sessionId ? (
          <div className="inline invite-actions">
            <button className="btn primary" type="button" onClick={() => copy(inviteText(inv, link), "Copied the invite text. Paste it in your group chat.")}>
              Copy invite text
            </button>
            <button className="btn" type="button" onClick={() => copy(link, "Copied the link.")}>
              Copy link
            </button>
            <a className="btn" href={link} target="_blank" rel="noreferrer">
              Open the page
            </a>
            <button className="btn" type="button" onClick={() => copy(reminderText(inv, link), "Copied a reminder for the group chat.")} title="A reminder for the day before, with a nudge to give the seat back if they can't come.">
              Copy reminder
            </button>
          </div>
        ) : null}

        <section className="invite-form">
          <h3>{inv ? "Details" : "The night"}</h3>
          {dates.length && !inv?.sessionId ? (
            <label className="fld-row">
              <span>On the storyboard</span>
              <select className="fld" value={d.storyDateId} onChange={(e) => pickDate(e.target.value)}>
                <option value="">Not on the storyboard</option>
                {dates.map((x) => {
                  const ep = x.episodeId ? episodes.find((e) => e.id === x.episodeId) : undefined;
                  return (
                    <option key={x.id} value={x.id}>
                      {whenText({ date: x.date, time: "" }).replace(/ at $/, "")}
                      {ep ? `: ${ep.title}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          ) : null}
          <label className="fld-row">
            <span>Title</span>
            <input className="fld" value={d.title} maxLength={80} placeholder="The Bell under Marrowmere: one-shot" onChange={(e) => set("title", e.target.value)} />
          </label>
          <div className="invite-three">
            <label className="fld-row">
              <span>Date</span>
              <input className="fld" type="date" value={d.date} onChange={(e) => set("date", e.target.value)} />
            </label>
            <label className="fld-row">
              <span>Starts</span>
              <input className="fld" type="time" value={d.time} onChange={(e) => set("time", e.target.value)} />
            </label>
            <label className="fld-row">
              <span>Ends about</span>
              <input className="fld" type="time" value={d.endTime} onChange={(e) => set("endTime", e.target.value)} />
            </label>
          </div>
          <div className="invite-two">
            <label className="fld-row">
              <span>Place (everyone sees)</span>
              <input className="fld" value={d.place} maxLength={80} placeholder="Sam's place, Northside" onChange={(e) => set("place", e.target.value)} />
            </label>
            <label className="fld-row">
              <span>Address (only people with a seat)</span>
              <input className="fld" value={d.address} maxLength={160} placeholder="14 Larch St, buzz 3B" onChange={(e) => set("address", e.target.value)} />
            </label>
          </div>
          <label className="fld-row">
            <span>Blurb</span>
            <textarea className="fld" rows={3} maxLength={400} value={d.blurb} placeholder="Level 1, no experience needed. Characters provided if you want one." onChange={(e) => set("blurb", e.target.value)} />
          </label>
          <div className="fld-row">
            <span>Picture</span>
            <div className="invite-art">
              {d.art ? <img src={d.art} alt="" /> : <span className="invite-thumb blank big" aria-hidden="true" />}
              <label className="btn small">
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
              </label>
              {art.length ? (
                <button className="btn small" type="button" aria-expanded={picking} onClick={() => setPicking((x) => !x)}>
                  Pick from campaign
                </button>
              ) : null}
              {d.art ? (
                <button className="btn small" type="button" onClick={() => set("art", "")}>
                  Remove
                </button>
              ) : null}
            </div>
            {picking ? (
              <div className="invite-art-pick">
                {art.map((a) => (
                  <button key={a.url} type="button" className={d.art === a.url ? "on" : ""} title={a.label} onClick={() => (set("art", a.url), setPicking(false))}>
                    <img src={a.url} alt={a.label} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <h3>Seats</h3>
          <div className="invite-three">
            <label className="fld-row">
              <span>Seats</span>
              <select className="fld" value={d.seats} onChange={(e) => set("seats", Number(e.target.value))}>
                {Array.from({ length: SEATS_MAX }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n} disabled={!!inv && n < seated(inv).length}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            {parties.length > 1 ? (
              <label className="fld-row">
                <span>Who it&rsquo;s for</span>
                <select className="fld" value={d.partyId} onChange={(e) => set("partyId", e.target.value)} disabled={!!inv?.sessionId}>
                  <option value="">Open call (anyone with the link)</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} only
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="fld-row">
              <span>Claims close</span>
              <select className="fld" value={d.closes} onChange={(e) => set("closes", e.target.value as Closes)}>
                <option value="start">At the start</option>
                <option value="2h">2 hours before</option>
                <option value="1d">The day before</option>
              </select>
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={d.waitlist} onChange={(e) => set("waitlist", e.target.checked)} /> Waitlist when full
          </label>
          <label className="check">
            <input type="checkbox" checked={d.showWho} onChange={(e) => set("showWho", e.target.checked)} /> Show who&rsquo;s coming (first names)
          </label>
          <label className="check">
            <input type="checkbox" checked={d.approve} onChange={(e) => set("approve", e.target.checked)} /> I approve each claim
          </label>
          {!inv && players.length ? (
            <div className="fld-row">
              <span>Hold a seat for</span>
              <div className="invite-holds">
                {players.map((p) => (
                  <label key={p.id} className={`chip-check${hold.includes(p.id) ? " on" : ""}`}>
                    <input type="checkbox" checked={hold.includes(p.id)} disabled={!hold.includes(p.id) && hold.length >= d.seats} onChange={(e) => setHold((h) => (e.target.checked ? [...h, p.id] : h.filter((x) => x !== p.id)))} />
                    {p.name}
                  </label>
                ))}
              </div>
              <span className="note">Their seat is saved; they open the link on the phone they play on and it&rsquo;s theirs.</span>
            </div>
          ) : null}

          <div className="inline invite-save">
            <button className="btn primary" type="button" disabled={!ok || (!!inv && !changed)} onClick={() => void save()}>
              {inv ? "Save changes" : "Make invite"}
            </button>
            {inv && changed ? (
              <button className="btn" type="button" onClick={() => setD(draftOf(inv))}>
                Undo changes
              </button>
            ) : null}
            {!ok ? <span className="note">Give it a title, a date and a start time.</span> : null}
          </div>
        </section>

        {!inv ? preview : null}

        {inv ? <InviteDanger inv={inv} onGone={() => onDone()} /> : null}
      </div>
    </Drawer>
  );
}

function InviteSeats({ inv }: { inv: Invite }) {
  const { view, run } = useDm();
  const s = view.state;
  const ins = seated(inv);
  const line = waiting(inv);
  const asks = asking(inv);
  const gone = inv.entries.filter((e) => e.state === "out" || e.state === "removed");
  const [holdId, setHoldId] = useState("");
  const holdable = s.players.filter((p) => !p.archived && !inv.entries.some((e) => e.playerId === p.id && (e.state === "in" || e.state === "wait" || e.state === "ask")));
  const auto = inv.startsAt - Date.now() > 2 * 3600_000;
  return (
    <section className="invite-seats">
      <h3>
        Seats <span className="note">· {ins.length} of {inv.seats} taken{line.length ? `, ${line.length} waiting` : ""}</span>
      </h3>
      <ol className="invite-people">
        {ins.map((e) => (
          <SeatRow key={e.id} inv={inv} e={e} />
        ))}
        {Array.from({ length: Math.max(0, inv.seats - ins.length) }, (_, i) => (
          <li key={`open${i}`} className="invite-person open">
            Open seat
          </li>
        ))}
      </ol>
      {!inv.sessionId && openSeats(inv) > 0 && line.length && !auto ? <p className="note warn">A seat is open and it&rsquo;s less than 2 hours to the start, so the line no longer moves up by itself. Give the next person the seat if they can still make it.</p> : null}
      {asks.length ? (
        <>
          <h4>Asking for a seat</h4>
          <ol className="invite-people">
            {asks.map((e) => (
              <SeatRow key={e.id} inv={inv} e={e} />
            ))}
          </ol>
        </>
      ) : null}
      {line.length ? (
        <>
          <h4>Waitlist</h4>
          <ol className="invite-people">
            {line.map((e, i) => (
              <SeatRow key={e.id} inv={inv} e={e} place={i + 1} />
            ))}
          </ol>
        </>
      ) : null}
      {!inv.sessionId && holdable.length ? (
        <div className="inline invite-hold">
          <select className="fld" aria-label="Hold a seat for" value={holdId} onChange={(e) => setHoldId(e.target.value)}>
            <option value="">Hold a seat for one of your players…</option>
            {holdable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn small" type="button" disabled={!holdId || openSeats(inv) <= 0} onClick={async () => (await run({ type: "invite.hold", inviteId: inv.id, playerId: holdId, held: true }, "Seat saved.")) && setHoldId("")}>
            Hold
          </button>
        </div>
      ) : null}
      {gone.length ? (
        <details className="invite-gone">
          <summary>Gave their seat back or taken off ({gone.length})</summary>
          <ul>
            {gone.map((e) => (
              <li key={e.id}>
                {entryName(s, e)} <span className="note">{e.state === "removed" ? "taken off" : "gave it back"}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function SeatRow({ inv, e, place }: { inv: Invite; e: InviteEntry; place?: number }) {
  const { view, run } = useDm();
  const { linkOf, copy } = useLink();
  const s = view.state;
  const p = e.playerId ? s.players.find((x) => x.id === e.playerId) : undefined;
  const name = entryName(s, e);
  const ch = p?.character || e.character;
  const act = (action: "in" | "wait" | "remove" | "up" | "down" | "told" | "ok" | "no", msg?: string) => run({ type: "invite.entry", inviteId: inv.id, entryId: e.id, action }, msg);
  const untold = e.state === "in" && e.movedUpAt && !e.told;
  const locked = !!inv.sessionId;
  return (
    <li className={`invite-person state-${e.state}${untold ? " untold" : ""}`}>
      <span className="pg-avatar" aria-hidden="true">
        {place ?? (name.trim().charAt(0).toUpperCase() || "?")}
      </span>
      <span className="invite-person-name">
        {name}
        {ch ? <span className="note"> · {ch}</span> : null}
      </span>
      {e.held ? <span className="tag gold">Held</span> : null}
      {e.movedUpAt ? <span className="tag">Moved up</span> : null}
      {untold ? (
        <button className="btn small primary" type="button" onClick={() => copy(movedUpText(inv, name, linkOf(inv)), `Copied the message for ${name}.`, () => void act("told"))}>
          Copy message
        </button>
      ) : null}
      {e.state === "ask" && !locked ? (
        <>
          <button className="btn small primary" type="button" disabled={openSeats(inv) <= 0} onClick={() => void act("ok", `${name} has a seat.`)}>
            Approve
          </button>
          <button className="btn small" type="button" onClick={() => void act("no", `Turned down ${name}.`)}>
            Turn down
          </button>
        </>
      ) : null}
      {locked ? null : (
        <RowMenu label={name}>
          {e.state === "wait" ? (
            <>
              <MenuItem disabled={openSeats(inv) <= 0} onClick={() => void act("in", `${name} has a seat.`)}>
                Give them a seat
              </MenuItem>
              <MenuItem onClick={() => void act("up")}>Move up the line</MenuItem>
              <MenuItem onClick={() => void act("down")}>Move down the line</MenuItem>
            </>
          ) : null}
          {e.state === "in" && inv.waitlist ? <MenuItem onClick={() => void act("wait", `${name} is back on the waitlist.`)}>Back to the waitlist</MenuItem> : null}
          {e.state === "in" && e.movedUpAt && e.told ? <MenuItem onClick={() => copy(movedUpText(inv, name, linkOf(inv)), `Copied the message for ${name}.`)}>Copy the moved-up message again</MenuItem> : null}
          <MenuItem onClick={() => void act("remove", `Took ${name} off.`)}>Take them off</MenuItem>
        </RowMenu>
      )}
    </li>
  );
}

function InviteDanger({ inv, onGone }: { inv: Invite; onGone: () => void }) {
  const { run } = useDm();
  const [dup, setDup] = useState(() => plusDays(inv.date, 7));
  const [sure, setSure] = useState<"cancel" | "delete" | null>(null);
  return (
    <section className="invite-more">
      <h3>More</h3>
      {!inv.sessionId ? (
        <div className="inline">
          {inv.status === "open" ? (
            <button className="btn" type="button" onClick={() => run({ type: "invite.status", inviteId: inv.id, status: "closed" }, "Claims closed. People with a seat keep it.")}>
              Close claims
            </button>
          ) : (
            <button className="btn" type="button" onClick={() => run({ type: "invite.status", inviteId: inv.id, status: "open" }, "Open for claims again.")}>
              {inv.status === "cancelled" ? "Un-cancel" : "Reopen claims"}
            </button>
          )}
          {inv.status !== "cancelled" ? (
            sure === "cancel" ? (
              <>
                <span className="note">Everyone&rsquo;s page will say it&rsquo;s cancelled.</span>
                <button className="btn danger" type="button" onClick={() => (setSure(null), void run({ type: "invite.status", inviteId: inv.id, status: "cancelled" }, "Cancelled. Tell the group chat too."))}>
                  Cancel the night
                </button>
                <button className="btn" type="button" onClick={() => setSure(null)}>
                  Keep it
                </button>
              </>
            ) : (
              <button className="btn" type="button" onClick={() => setSure("cancel")}>
                Cancel the night…
              </button>
            )
          ) : null}
        </div>
      ) : null}
      <div className="inline">
        <label className="fld-row inline-fld">
          <span>Same invite on</span>
          <input className="fld" type="date" value={dup} onChange={(e) => setDup(e.target.value)} />
        </label>
        <button
          className="btn"
          type="button"
          onClick={() =>
            run(
              { type: "invite.duplicate", inviteId: inv.id, date: dup, time: inv.time, endTime: inv.endTime ?? "", startsAt: momentOf(dup, inv.time), endsAt: inv.endTime ? endOf(dup, inv.time, inv.endTime) : null },
              `Made a copy for ${whenText({ date: dup, time: inv.time })}. Held seats came along.`,
            )
          }
        >
          Duplicate
        </button>
      </div>
      <div className="inline">
        {sure === "delete" ? (
          <>
            <span className="note">Deletes the invite and its link. People who never played are tidied away.</span>
            <button className="btn danger" type="button" onClick={async () => (await run({ type: "invite.remove", inviteId: inv.id }, "Deleted.")) && onGone()}>
              Delete invite
            </button>
            <button className="btn" type="button" onClick={() => setSure(null)}>
              Keep it
            </button>
          </>
        ) : (
          <button className="btn danger" type="button" onClick={() => setSure("delete")}>
            Delete…
          </button>
        )}
      </div>
      <p className="note">
        Starts {timeText(inv.time)} on {inv.date}. {inv.sessionId ? "Played." : "When you start the session that night, tick “Seat tonight’s invite”."}
      </p>
    </section>
  );
}
