"use client";

// DM shop tools for the progression shop: what kind of item it is, its
// effects, granting Earned items, chipping in to projects, and what's running.

import { useState } from "react";
import { cpToGpInput, formatCp, parseAmount } from "@/shared/money";
import { CATEGORIES, KINDS, raisedCp } from "@/shared/progress";
import type { Effect, Item, ItemCategory, ItemKind } from "@/shared/types";
import { useDm } from "./context";
import { Field } from "./Field";
import { Check } from "./Check";

type Patch = (p: Partial<Item>) => unknown;

/** Category, kind and the settings each kind needs. Goes inside the item editor. */
export function KindFields({ it, patch }: { it: Item; patch: Patch }) {
  return (
    <>
      <div className="inline">
        <label className="inline-label">
          Category
          <select className="fld" value={it.category} onChange={(e) => patch({ category: e.target.value as ItemCategory })}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-label">
          Type
          <select className="fld" value={it.kind} onChange={(e) => patch({ kind: e.target.value as ItemKind })}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {it.kind === "training" ? (
        <Field
          label="Paid in how many lessons (one per session)"
          type="number"
          value={String(it.installments ?? 1)}
          onCommit={(v) => {
            const n = Number(v);
            if (!Number.isInteger(n) || n < 1 || n > 20) return false;
            void patch({ installments: n });
          }}
        />
      ) : null}
      {it.kind === "service" || it.kind === "training" ? (
        <Field label="Ask the player (leave blank for nothing)" value={it.prompt ?? ""} placeholder="e.g. Which language or tool?" onCommit={(v) => patch({ prompt: v })} />
      ) : null}
      {it.kind === "service" ? (
        <Check checked={!!it.flyer} onChange={(v) => patch({ flyer: v })}>
          The player writes a flyer for the notice board
        </Check>
      ) : null}
      <Check checked={!!it.keep} onChange={(v) => patch({ keep: v })}>
        Goes on the buyer&rsquo;s page once bought (a trophy, a title, a house)
      </Check>
      <Field label="Tags (for discounts; commas between)" value={(it.tags ?? []).join(", ")} placeholder="e.g. armor, potion" onCommit={(v) => patch({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
      <EffectsEditor it={it} patch={patch} />
    </>
  );
}

const EFFECT_LABEL: Record<Effect["type"], string> = {
  unlock: "Unlock an item or storefront",
  discount: "Discount",
  income: "Income each session",
  credit: "Credit line (a tab)",
};

function blankEffect(type: Effect["type"]): Effect {
  if (type === "unlock") return { type };
  if (type === "discount") return { type, pct: 10, category: "healing" };
  if (type === "income") return { type, dice: "1d6", unitCp: 100 };
  return { type, limitCp: 1000 };
}

/** What buying (or funding) it does. Only you see this. */
function EffectsEditor({ it, patch }: { it: Item; patch: Patch }) {
  const { view } = useDm();
  const s = view.state;
  const effects = it.effects ?? [];
  const set = (i: number, e: Effect) => patch({ effects: effects.map((x, k) => (k === i ? e : x)) });
  const on = !!s.effectsOn[it.id];
  return (
    <fieldset className="form">
      <legend>
        Effects (only you see these){on ? " · live now" : ""}
      </legend>
      {effects.map((e, i) => (
        <div key={i} className="effect-row">
          <b>{EFFECT_LABEL[e.type]}</b>
          {e.type === "unlock" ? (
            <>
              <select className="fld" value={e.itemId ?? ""} onChange={(ev) => set(i, { ...e, itemId: ev.target.value || undefined })} aria-label="Item to unlock">
                <option value="">No item</option>
                {s.items
                  .filter((x) => x.id !== it.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
              <select className="fld" value={e.shopId ?? ""} onChange={(ev) => set(i, { ...e, shopId: ev.target.value || undefined })} aria-label="Storefront to open">
                <option value="">No storefront</option>
                {s.shops.map((x) => (
                  <option key={x.id} value={x.id}>
                    Open {x.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          {e.type === "discount" ? (
            <>
              <input className="fld amt" type="number" min={1} max={50} value={e.pct} aria-label="Percent off" onChange={(ev) => set(i, { ...e, pct: Math.max(1, Math.min(50, Number(ev.target.value) || 1)) })} />
              <span>% off</span>
              <select className="fld" value={e.category ?? ""} onChange={(ev) => set(i, { ...e, category: (ev.target.value || undefined) as ItemCategory | undefined })} aria-label="Category">
                <option value="">No category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input className="fld" value={e.tag ?? ""} placeholder="or a tag" aria-label="Tag" onChange={(ev) => set(i, { ...e, tag: ev.target.value || undefined })} />
            </>
          ) : null}
          {e.type === "income" ? (
            <>
              <input className="fld amt" value={e.dice} aria-label="Dice" onChange={(ev) => set(i, { ...e, dice: ev.target.value })} />
              <span>×</span>
              <input
                className="fld amt"
                defaultValue={cpToGpInput(e.unitCp)}
                aria-label="Each point is worth (gp)"
                onBlur={(ev) => {
                  const cp = parseAmount(ev.target.value);
                  if (cp !== null) void set(i, { ...e, unitCp: cp });
                }}
              />
              <span>gp, split by share</span>
            </>
          ) : null}
          {e.type === "credit" ? (
            <>
              <span>up to</span>
              <input
                className="fld amt"
                defaultValue={cpToGpInput(e.limitCp)}
                aria-label="Credit limit (gp)"
                onBlur={(ev) => {
                  const cp = parseAmount(ev.target.value);
                  if (cp !== null) void set(i, { ...e, limitCp: cp });
                }}
              />
              <span>gp, at this storefront</span>
            </>
          ) : null}
          <button type="button" className="btn small" onClick={() => patch({ effects: effects.filter((_, k) => k !== i) })}>
            Remove
          </button>
        </div>
      ))}
      <label className="inline-label">
        Add an effect
        <select
          className="fld"
          value=""
          onChange={(ev) => {
            if (ev.target.value) void patch({ effects: [...effects, blankEffect(ev.target.value as Effect["type"])] });
          }}
        >
          <option value="">Choose…</option>
          {(Object.keys(EFFECT_LABEL) as Effect["type"][]).map((t) => (
            <option key={t} value={t}>
              {EFFECT_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <p className="note">For what it means for the story later (allies, favors), use the DM note.</p>
    </fieldset>
  );
}

/** Put a player's gold toward a project from the DM view. */
export function ContributeBox({ it, onDone }: { it: Item; onDone: () => void }) {
  const { view, run } = useDm();
  const players = view.state.players.filter((p) => !p.archived);
  const [who, setWho] = useState(players[0]?.id ?? "");
  const [amt, setAmt] = useState("");
  const cp = parseAmount(amt);
  const left = Math.max(0, it.priceCp - raisedCp(view.state, it.id));
  return (
    <form
      className="buyers"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!cp || !who) return;
        if (await run({ type: "project.contribute", playerId: who, itemId: it.id, amountCp: cp }, `Put ${formatCp(Math.min(cp, left))} toward ${it.name}.`)) onDone();
      }}
    >
      <select className="fld" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Who's putting gold in?">
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({formatCp(p.balanceCp)})
          </option>
        ))}
      </select>
      <input className="fld amt" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={`up to ${cpToGpInput(left)}`} aria-label="How much (gp)" />
      <button className="btn small primary" type="submit" disabled={!cp}>
        Put it in
      </button>
      <button className="btn small" type="button" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}

/** Grant an Earned item to some players. */
export function GrantBox({ it, onDone }: { it: Item; onDone: () => void }) {
  const { view, run } = useDm();
  const players = view.state.players.filter((p) => !p.archived);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  return (
    <form
      className="buyers"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!picked.length) return;
        if (await run({ type: "award.grant", itemId: it.id, playerIds: picked, note }, `Granted ${it.name}.`)) onDone();
      }}
    >
      <div className="checks">
        {players.map((p) => (
          <label className="check" key={p.id}>
            <input type="checkbox" checked={picked.includes(p.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, p.id] : picked.filter((x) => x !== p.id))} />
            {p.name}
          </label>
        ))}
      </div>
      <input className="fld" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Why (they see it), e.g. Best tale on Tale Night" />
      <button className="btn small primary" type="submit" disabled={!picked.length}>
        Grant
      </button>
      <button className="btn small" type="button" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}

/** Rentals, lessons, honours, and which effects are live. */
export function RunningBox() {
  const { view, run } = useDm();
  const s = view.state;
  const name = (id: string) => s.players.find((p) => p.id === id)?.name ?? "someone who left";
  const rentals = s.rentals.filter((r) => r.active);
  const lessons = s.trainings.filter((t) => !t.done && !t.cancelled);
  const live = s.items.filter((i) => s.effectsOn[i.id] && i.effects?.length);
  if (!rentals.length && !lessons.length && !s.awards.length && !live.length) return null;
  return (
    <section className="box">
      <h3>Rentals, lessons and honours</h3>
      <ul className="orders">
        {rentals.map((r) => (
          <li key={r.id}>
            <span>
              <b>{r.itemName}</b>: {name(r.playerId)} &middot; {formatCp(r.monthlyCp)} a session &middot; paid through session {r.paidThrough}
            </span>
            <button className="btn small" type="button" onClick={() => run({ type: "rental.cancel", rentalId: r.id }, `${r.itemName} is no longer rented.`)}>
              End rental
            </button>
          </li>
        ))}
        {lessons.map((t) => (
          <li key={t.id}>
            <span>
              <b>{t.itemName}</b>
              {t.what ? ` (${t.what})` : ""}: {name(t.playerId)} &middot; {t.paid} of {t.of} paid
            </span>
            <button className="btn small" type="button" onClick={() => confirm(`Stop ${name(t.playerId)}'s lessons? Nothing is refunded.`) && void run({ type: "training.cancel", trainingId: t.id }, "Lessons stopped.")}>
              Stop lessons
            </button>
          </li>
        ))}
        {s.awards.map((a) => (
          <li key={a.id}>
            <span>
              <span className="earned-badge">Earned</span> <b>{a.itemName}</b>: {a.playerIds.map(name).join(", ")}
              {a.note ? ` · ${a.note}` : ""}
            </span>
            <button className="btn small" type="button" onClick={() => confirm(`Take back ${a.itemName}?`) && void run({ type: "award.revoke", awardId: a.id })}>
              Take back
            </button>
          </li>
        ))}
        {live.map((i) => (
          <li key={i.id}>
            <span>
              Live: <b>{i.name}</b> &middot; {(i.effects ?? []).map((e) => EFFECT_LABEL[e.type].toLowerCase()).join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
