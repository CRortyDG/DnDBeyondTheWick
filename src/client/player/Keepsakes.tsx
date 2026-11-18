"use client";

import { useState } from "react";
import type { PlayerView } from "@/shared/projection";
import type { PublicKeepsake } from "@/shared/keepsakes";
import { namesList } from "@/shared/keepsakes";
import { BannerToast } from "../ui/BannerToast";

/**
 * The Keepsakes shelf: small things this character carried away from real
 * moments, each with its line. The party's are folded underneath.
 */
export function KeepsakeShelf({ view }: { view: PlayerView }) {
  const all = view.keepsakes ?? [];
  if (!all.length) return null;
  const mine = all.filter((k) => k.mine);
  const party = all.filter((k) => !k.mine);
  return (
    <section className="ks-shelf" aria-label="Keepsakes">
      <h2 className="ks-shelf-title">Keepsakes</h2>
      {mine.length ? (
        <ul className="ks-items">
          {mine.map((k) => (
            <Item key={k.id} k={k} me={view.me.character ?? view.me.name} />
          ))}
        </ul>
      ) : (
        <p className="ks-empty">Nothing on your shelf yet. Your DM gives keepsakes for moments worth remembering.</p>
      )}
      {party.length ? (
        <details className="ks-party">
          <summary>
            The party&rsquo;s keepsakes <span className="ks-count">{party.length}</span>
          </summary>
          <ul className="ks-items">
            {party.map((k) => (
              <Item key={k.id} k={k} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function Item({ k, me }: { k: PublicKeepsake; me?: string }) {
  const [open, setOpen] = useState(false);
  const others = me ? k.who.filter((w) => w !== me) : k.who;
  const meta = [k.chapter !== undefined ? `Chapter ${k.chapter}` : null, others.length ? (me ? `shared with ${namesList(others)}` : namesList(others)) : null].filter(Boolean).join(" · ");
  return (
    <li className={`ks-item${open ? " open" : ""}`}>
      <button type="button" className="ks-item-btn" aria-expanded={open} onClick={() => setOpen((x) => !x)}>
        <span className="ks-item-mark" aria-hidden="true" />
        <span className="ks-item-name">{k.name}</span>
      </button>
      {open ? (
        <div className="ks-item-body">
          {k.line ? <p className="ks-item-line">{k.line}</p> : null}
          {meta ? <p className="ks-item-meta">{meta}</p> : null}
        </div>
      ) : null}
    </li>
  );
}

/** A quiet "A new keepsake" line when the DM gives me one (never on first load). */
export function KeepsakeToast({ view }: { view: PlayerView }) {
  const newest = (view.keepsakes ?? []).find((k) => k.mine);
  return <BannerToast banner={newest ? { id: `ks-${newest.id}`, text: `A new keepsake: ${newest.name}`, at: 0 } : null} className="phone-banner keepsake-banner" />;
}
