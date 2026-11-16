"use client";

import { useState } from "react";
import { hrefFor } from "./api";
import { HomeShell } from "./Home";

/** No ?player= yet: "Who's at the table?" Styles: landing-theme.css. */
export function Landing({ game }: { game: string }) {
  const [name, setName] = useState("");
  return (
    <HomeShell>
      <section className="hm-card hm-seat" aria-labelledby="hm-seat-title">
        <div className="hm-card-head">
          <span className="hm-kicker">
            Campaign <span className="hm-pill">{game}</span>
          </span>
          <h1 id="hm-seat-title">Who&rsquo;s at the table?</h1>
          <p>Write your name to pull up a chair. Use the same name every week.</p>
        </div>
        <form
          className="hm-form"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (n) window.location.href = hrefFor(game, n);
          }}
        >
          <label className="hm-field">
            <span className="hm-label">Your name</span>
            <input
              className="hm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="nickname"
              autoCapitalize="words"
              autoFocus
              enterKeyHint="go"
              maxLength={32}
            />
          </label>
          <button className="hm-btn primary" type="submit" disabled={!name.trim()}>
            Take a seat
          </button>
        </form>
        <div className="hm-alt">
          <span>Not a player?</span>
          <a href={hrefFor(game, "TV")}>This is the TV</a>
          <a href={hrefFor(game, "DM")}>I&rsquo;m the DM</a>
        </div>
      </section>
      <p className="hm-back-home">
        <a href="/">Wrong campaign? Enter another code</a>
      </p>
    </HomeShell>
  );
}
