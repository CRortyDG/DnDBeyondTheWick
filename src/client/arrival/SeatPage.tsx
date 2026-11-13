"use client";

import { useEffect, useRef, useState } from "react";
import type { ArrivalView } from "@/shared/arrival";
import { fill, SEAT_PAGE } from "./content";
import { SoundIcon } from "./Intro";
import { RoundTable } from "./RoundTable";

const CHARACTER_MAX = 40;
const WHY_MAX = 120;

export function SeatPage({
  view,
  loading,
  onClaim,
  onReplay,
  soundOn,
  onToggleSound,
}: {
  view: ArrivalView | null;
  loading: boolean;
  onClaim: (character: string, why: string) => Promise<string | null>;
  onReplay: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const me = view?.me ?? null;
  const [editing, setEditing] = useState(false);
  const [character, setCharacter] = useState(me?.character ?? "");
  const [why, setWhy] = useState(me?.why ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Bumped on each claim: replays the flare and Mags's key. */
  const [claimedNow, setClaimedNow] = useState(0);
  const seeded = useRef(false);

  useEffect(() => {
    if (me && !seeded.current) {
      seeded.current = true;
      setCharacter(me.character);
      setWhy(me.why);
    }
  }, [me]);

  const showForm = !!me && (!me.claimed || editing);
  const canEdit = !!me && me.claimed && !view?.locked;

  async function claim(c: string, w: string) {
    setBusy(true);
    setError(null);
    const err = await onClaim(c, w);
    setBusy(false);
    if (err) return setError(err);
    setEditing(false);
    setClaimedNow((n) => n + 1);
  }

  const seats = (view?.seats ?? []).map((s) => ({ ...s, flare: s.me ? claimedNow : 0 }));
  const keyLine = me?.character?.trim() ? fill(SEAT_PAGE.keyLine, me.character) : SEAT_PAGE.keyLineNoName;

  return (
    <main className="seat-page">
      <div className="seat-top">
        <button type="button" className="icon-btn" onClick={onToggleSound} aria-pressed={soundOn} aria-label={soundOn ? "Sound on. Tap to turn it off." : "Sound off. Tap to turn it on."}>
          <SoundIcon on={soundOn} />
        </button>
      </div>
      <header className="seat-header">
        <h1>{SEAT_PAGE.header}</h1>
        <RoundTable seats={seats.length ? seats : [0, 1, 2, 3].map(() => ({ name: null, lit: false }))} names={false} size={180} className="seat-table" />
      </header>

      {loading && !view ? <p className="seat-note">&hellip;</p> : null}

      {view && !me ? <p className="seat-note">{SEAT_PAGE.noLink}</p> : null}

      {showForm ? (
        <form
          className="seat-form"
          onSubmit={(e) => {
            e.preventDefault();
            void claim(character, why);
          }}
        >
          <h2>{SEAT_PAGE.question}</h2>
          <label>
            <span>{SEAT_PAGE.nameLabel}</span>
            <input value={character} onChange={(e) => setCharacter(e.target.value)} maxLength={CHARACTER_MAX} autoComplete="off" autoCapitalize="words" spellCheck={false} enterKeyHint="next" />
          </label>
          <label>
            <span>
              {SEAT_PAGE.whyLabel} <em>(optional)</em>
            </span>
            <input value={why} onChange={(e) => setWhy(e.target.value)} maxLength={WHY_MAX} autoComplete="off" enterKeyHint="done" />
            <small className="count" aria-live="polite">
              {why.length > WHY_MAX - 20 ? `${WHY_MAX - why.length} left` : ""}
            </small>
          </label>
          {error ? (
            <p className="seat-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="seat-btn primary" disabled={busy}>
            {SEAT_PAGE.takeSeat}
          </button>
          {!me.claimed ? (
            <button type="button" className="seat-link" disabled={busy} onClick={() => void claim("", why)}>
              {SEAT_PAGE.decideLater}
            </button>
          ) : (
            <button type="button" className="seat-link" onClick={() => setEditing(false)}>
              Never mind
            </button>
          )}
        </form>
      ) : null}

      {me?.claimed && !showForm ? (
        <section className="seat-claimed">
          {claimedNow ? (
            <div className="key-slide" key={claimedNow} aria-live="polite">
              <svg viewBox="0 0 80 30" width="64" height="24" aria-hidden="true" className="key">
                <circle cx="12" cy="15" r="9" fill="none" stroke="#c9a14a" strokeWidth="4" />
                <path d="M21 15 H74 M62 15 v8 M70 15 v6" stroke="#c9a14a" strokeWidth="4" fill="none" />
              </svg>
              <p className="speech">{keyLine}</p>
            </div>
          ) : (
            <p className="speech mine">{me.character ? me.character : "A stranger, for now."}</p>
          )}
          {me.why ? <p className="seat-why">&ldquo;{me.why}&rdquo;</p> : null}

          <h2>{SEAT_PAGE.seatsHeading}</h2>
          <ul className="seat-list">
            {view!.seats.map((s, i) => (
              <li key={i} className={s.lit ? "lit" : ""}>
                <span className="dot" aria-hidden="true" />
                {s.lit ? <span>{s.name}{s.me ? " (you)" : ""}</span> : <span className="empty">{SEAT_PAGE.emptySeat}</span>}
              </li>
            ))}
          </ul>
          {canEdit ? (
            <button type="button" className="seat-link" onClick={() => setEditing(true)}>
              {SEAT_PAGE.edit}
            </button>
          ) : view?.locked ? (
            <p className="seat-note">{SEAT_PAGE.locked}</p>
          ) : null}
        </section>
      ) : null}

      <nav className="seat-actions">
        <button type="button" className="seat-btn" onClick={onReplay}>
          {SEAT_PAGE.replay}
        </button>
        {me ? (
          <a className="seat-btn" href={me.tableHref}>
            {SEAT_PAGE.table}
          </a>
        ) : null}
      </nav>
    </main>
  );
}
