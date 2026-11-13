"use client";

import { useState } from "react";
import { hrefFor } from "./api";
import { Notice } from "./ui/Notice";

/** No ?player= yet: "Who's at the table?" */
export function Landing({ game }: { game: string }) {
  const [name, setName] = useState("");
  return (
    <Notice title={"Who\u2019s at the table?"}>
      <p>Write your name to pull up a chair. It&rsquo;s the same name every week.</p>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const n = name.trim();
          if (n) window.location.href = hrefFor(game, n);
        }}
      >
        <label>
          Your name
          <input className="fld big" value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" autoCapitalize="words" autoFocus maxLength={32} />
        </label>
        <button className="btn primary big" type="submit" disabled={!name.trim()}>
          Take a seat
        </button>
      </form>
      <p className="landing-links">
        <a href={hrefFor(game, "TV")}>This is the TV</a>
        <span aria-hidden="true"> &middot; </span>
        <a href={hrefFor(game, "DM")}>I&rsquo;m the DM</a>
      </p>
    </Notice>
  );
}
