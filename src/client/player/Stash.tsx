"use client";

import { useState } from "react";
import type { PlayerView } from "@/shared/projection";
import { ITEM_KIND_NAME } from "@/shared/sheetGear";

const names = (xs: string[]) =>
  xs.length <= 2
    ? xs.join(" and ")
    : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

/**
 * The party stash on the phone: loot nobody has claimed yet. Players say what
 * they'd like (the DM hands it out), or take it themselves when the DM allows.
 */
export function PartyStash({
  view,
  send,
}: {
  view: PlayerView;
  send: (c: object) => Promise<string | null>;
}) {
  const st = view.stash;
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  if (!st?.items.length) return null;
  const canTake =
    st.take && !!view.me.sheet && !view.me.sheetOff && !view.me.archived;
  const act = async (id: string, cmd: object, ok: string) => {
    setBusy(id);
    const err = await send(cmd);
    setBusy(null);
    setMsg(err ?? ok);
  };
  return (
    <section className="box pl-stash" aria-label="Party stash">
      <h2>Party stash</h2>
      <p className="note">
        {st.take
          ? "Loot nobody has claimed yet. Take what you need, or say you'd like it and talk it over."
          : "Loot nobody has claimed yet. Say what you'd like, and the DM hands it out."}
      </p>
      {st.items.length ? (
        <ul className="pl-stash-list">
          {st.items.map((it) => {
            const sub = [
              it.kind !== "gear"
                ? ITEM_KIND_NAME[it.kind] +
                  (it.attune ? ", needs attunement" : "")
                : "",
              it.source ? `from ${it.source}` : "",
              it.note ?? "",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={it.id}
                className={`pl-stash-item${it.mine ? " mine" : ""}`}
              >
                <span>
                  <b>{it.name}</b>
                  {it.qty > 1 ? ` × ${it.qty}` : ""}
                </span>
                <span className="pl-stash-btns">
                  <button
                    type="button"
                    className={`btn small${it.mine ? " on" : ""}`}
                    aria-pressed={it.mine}
                    disabled={busy === it.id}
                    onClick={() =>
                      void act(
                        it.id,
                        { type: "me.stashWant", stashId: it.id, on: !it.mine },
                        it.mine
                          ? `You don't need ${it.name}.`
                          : `The DM sees you'd like ${it.name}.`,
                      )
                    }
                  >
                    {it.mine ? "You asked ✓" : "I'd like this"}
                  </button>
                  {canTake ? (
                    <button
                      type="button"
                      className="btn small primary"
                      disabled={busy === it.id}
                      onClick={() =>
                        void act(
                          it.id,
                          { type: "me.stashTake", stashId: it.id, qty: 1 },
                          `${it.name} is in your inventory.`,
                        )
                      }
                    >
                      Take {it.qty > 1 ? "one" : "it"}
                    </button>
                  ) : null}
                </span>
                {sub ? <p className="note">{sub}</p> : null}
                {it.wants.length ? (
                  <p className="note">
                    {names(it.wants)} would like it{it.mine ? " too" : ""}.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {msg ? (
        <p className="note" role="status">
          {msg}
        </p>
      ) : null}
      {st.log.length ? (
        <details>
          <summary className="note">Who got what lately</summary>
          <ul className="pl-stash-log">
            {st.log.map((l, i) => (
              <li key={`${l.at}-${i}`}>{l.text}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
