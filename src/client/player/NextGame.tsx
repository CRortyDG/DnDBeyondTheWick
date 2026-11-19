"use client";

// "Next game: Saturday at 7:00 PM, you're in." A strip on the player's own page
// between sessions, from the DM's invites, with the details and Add to calendar
// a tap away. Claiming or giving a seat back stays on the invite page.

import { useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { calendarFile, googleCalendarLink, timeText, type NextGame as Next } from "@/shared/invites";
import { Sheet } from "./Sheet";

function localDay(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "Tonight", "Tomorrow", or "Sat, Nov 22". The date is as the DM typed it. */
export function dayText(date: string, time: string): string {
  if (date === localDay(0)) return Number(time.split(":")[0]) >= 17 ? "Tonight" : "Today";
  if (date === localDay(1)) return "Tomorrow";
  const d = new Date(`${date}T00:00:00Z`);
  return isNaN(+d) ? date : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function longDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return isNaN(+d) ? date : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

export function stateText(n: Next): string {
  switch (n.mine) {
    case "in":
      return "You're in";
    case "wait":
      return `Waitlist, number ${n.line ?? 1}`;
    case "ask":
      return "Waiting for the DM's OK";
    case "open":
      return n.left === 1 ? "1 seat left" : `${n.left ?? 0} seats left`;
    case "full":
      return "Table's full, waitlist open";
  }
}

export function NextGame({ view }: { view: PlayerView }) {
  const n = view.nextGame;
  const [open, setOpen] = useState(false);
  // During a session or a fight the night itself is on: no strip.
  if (!n || view.session || view.fight) return null;
  const url = window.location.origin + n.href;
  const where = n.address ? `${n.address}${n.place ? ` (${n.place})` : ""}` : n.place;
  const hours = timeText(n.time) + (n.endTime ? ` to about ${timeText(n.endTime)}` : "");
  const seated = n.mine === "in";

  const saveCalendar = () => {
    const blob = new Blob([calendarFile(n, url, where)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${n.title.replace(/[^\w -]+/g, "").trim() || "game-night"}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <>
      <button type="button" className={`pl-nextgame mine-${n.mine}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="pl-nextgame-k">Next game</span>
        <span className="pl-nextgame-v">
          <b>
            {dayText(n.date, n.time)} at {timeText(n.time)}
          </b>
          <span className="pl-nextgame-state">{stateText(n)}</span>
        </span>
        <span className="pl-nextgame-go" aria-hidden="true">
          {n.mine === "open" ? "Grab a seat" : n.mine === "full" ? "Waitlist" : "Details"}
        </span>
      </button>
      {open ? (
        <Sheet title="Next game" onClose={() => setOpen(false)} className="pl-nextgame-sheet">
          <div className="pl-ng-card">
            <div className="pl-ng-title">{n.title}</div>
            <p className="pl-ng-when">
              <b>{longDay(n.date)}</b> &middot; {hours}
            </p>
            {n.address || n.place ? (
              <p className="pl-ng-where">
                <span aria-hidden="true">📍 </span>
                {n.address ? (
                  <>
                    <b>{n.address}</b>
                    {n.place ? <span className="dim"> ({n.place})</span> : null}
                  </>
                ) : (
                  n.place
                )}
              </p>
            ) : null}
            {n.blurb ? <p className="pl-ng-blurb">{n.blurb}</p> : null}
            <p className={`pl-ng-state mine-${n.mine}`}>
              {n.mine === "in"
                ? "Your seat is saved."
                : n.mine === "wait"
                  ? `You're number ${n.line ?? 1} on the waitlist. If someone gives their seat back, the first in line moves up.`
                  : n.mine === "ask"
                    ? "You asked for a seat. The DM approves each one for this game."
                    : n.mine === "open"
                      ? `${stateText(n)}. First come, first served.`
                      : "The table's full, but you can join the waitlist."}
            </p>
          </div>
          {seated ? (
            <>
              <button type="button" className="btn primary big" onClick={saveCalendar}>
                Add to calendar
              </button>
              <p className="pl-ng-gcal">
                <a href={googleCalendarLink(n, url, where)} target="_blank" rel="noreferrer">
                  Or add it to Google Calendar
                </a>
              </p>
              <a className="btn big" href={n.href}>
                Open the invite
              </a>
              <p className="pl-ng-small">Can&rsquo;t make it? Give your seat back on the invite so the next person gets it.</p>
            </>
          ) : (
            <a className="btn primary big" href={n.href}>
              {n.mine === "open" ? "Grab a seat" : n.mine === "full" ? "Join the waitlist" : "Open the invite"}
            </a>
          )}
        </Sheet>
      ) : null}
    </>
  );
}
