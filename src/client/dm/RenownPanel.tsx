"use client";

// The DM's Renown page: where the party stands (award, set, history), the ladder
// itself (how many ranks, what they're called, how many points each takes) and
// what each rank opens in the shops, on the board and at the inn.

import { useMemo, useState } from "react";
import { defaultLadder, fillTown, jobsOf, jobTitle, ladderTemplate, nextDefaultPoints, pointsOf, rankForPoints, ranksOf, RENOWN_POINTS_MAX, RENOWN_TIERS_MAX, RENOWN_TIERS_MIN, renownOf, topRank, type RenownRank } from "@/shared/renown";
import { roomSettings } from "@/shared/rooms";
import type { GameState } from "@/shared/types";
import { townOf } from "@/shared/presets";
import { ask } from "./ask";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { RenownControl, RenownHistory } from "./RenownControl";

export function RenownPanel() {
  const { view } = useDm();
  const s = view.state;
  const ranks = ranksOf(s);
  const rank = renownOf(s);
  const [editing, setEditing] = useState(false);
  return (
    <div className="pg renown-page">
      <PageHead
        title="Renown"
        sub="The party's standing in town: the ranks, the points each one takes, and what they open."
        help={
          <>
            <p>Finished jobs and your awards add Renown points. When the points reach the next rank, the rank goes up by itself: the TV plays the moment, the Chronicle notes it, and anything waiting on that rank opens. Points never lower the rank. Lowering it is your call, with −, and it&rsquo;s quiet.</p>
            <p>The ladder is yours: {RENOWN_TIERS_MIN} to {RENOWN_TIERS_MAX} ranks, named however you like. When you move or remove a rank, everything that needs a rank (shop items, storefronts, jobs, the Good Room) keeps needing the same rank. Things that needed a removed rank need the rank below it instead.</p>
          </>
        }
        actions={
          !editing ? (
            <button type="button" className="btn primary" onClick={() => setEditing(true)}>
              Edit the ladder
            </button>
          ) : null
        }
        stats={[
          { label: "Party", value: ranks[rank].name, tone: "gold" },
          { label: "Points", value: pointsOf(s) },
          { label: "Ranks", value: ranks.length, tone: "muted" },
        ]}
      />
      <div className="panel-grid">
        {editing ? <LadderEditor onClose={() => setEditing(false)} /> : <LadderView onEdit={() => setEditing(true)} />}
        <section className="box">
          <h3>Where the party stands</h3>
          <CatchUp />
          <RenownControl />
          <ProgressToggle />
          <RenownHistory />
        </section>
      </div>
    </div>
  );
}

function ProgressToggle() {
  const { view, run } = useDm();
  return (
    <label className="check">
      <input type="checkbox" checked={!!view.state.renownProgress} onChange={(e) => void run({ type: "renown.progress", on: e.target.checked }, e.target.checked ? "Players now see the progress bar." : "Players see only the rank.")} /> Show Renown progress to players
    </label>
  );
}

/** The party's points already reach a higher rank (a threshold came down): offer to raise it. */
function CatchUp() {
  const { view, run } = useDm();
  const s = view.state;
  const reach = rankForPoints(s, pointsOf(s));
  if (reach <= renownOf(s)) return null;
  const name = ranksOf(s)[reach].name;
  return (
    <div className="renown-catchup" role="status">
      <p>
        The party has {pointsOf(s)} points, enough for <b>{name}</b> now. Their rank only goes up when you say so or when they next earn points.
      </p>
      <div className="inline">
        <button type="button" className="btn primary small" onClick={() => void run({ type: "renown.catchUp" }, `The party is now ${name}.`)}>
          Raise to {name}
        </button>
        <button type="button" className="btn small" onClick={() => void run({ type: "renown.catchUp", tv: false }, `The party is now ${name}.`)}>
          Raise quietly
        </button>
      </div>
    </div>
  );
}

interface Opens {
  items: string[];
  shops: string[];
  jobs: string[];
  goodRoom: boolean;
}

/** What waits on each rank: shop items, storefronts, open jobs, the Good Room. */
export function opensByRank(s: GameState): Opens[] {
  const top = topRank(s);
  const out: Opens[] = ranksOf(s).map(() => ({ items: [], shops: [], jobs: [], goodRoom: false }));
  const at = (n: number | undefined) => out[Math.max(0, Math.min(top, n ?? 0))];
  const shopName = new Map(s.shops.map((x) => [x.id, x.name]));
  for (const it of s.items) {
    if (!it.renown || (it.tier !== "sale" && it.tier !== "locked")) continue;
    at(it.renown).items.push(shopName.has(it.shopId) ? `${it.name} (${shopName.get(it.shopId)})` : it.name);
  }
  for (const sh of s.shops) if (sh.renown) at(sh.renown).shops.push(sh.name);
  for (const j of jobsOf(s)) if (j.renown && (j.status === "open" || j.status === "taken")) at(j.renown).jobs.push(jobTitle(j));
  const good = roomSettings(s).good;
  if (good.mode === "renown" && good.rank > 0 && s.rooms) at(good.rank).goodRoom = true;
  return out;
}

function opensLine(o: Opens): string {
  const parts: string[] = [];
  const n = (k: number, one: string, many: string) => (k ? parts.push(`${k} ${k === 1 ? one : many}`) : 0);
  n(o.items.length, "item", "items");
  n(o.shops.length, "storefront", "storefronts");
  n(o.jobs.length, "job", "jobs");
  if (o.goodRoom) parts.push("the Good Room");
  return parts.join(", ");
}

/** The ladder as it stands, with what each rank opens. */
function LadderView({ onEdit }: { onEdit: () => void }) {
  const { view } = useDm();
  const s = view.state;
  const ranks = ranksOf(s);
  const rank = renownOf(s);
  const opens = useMemo(() => opensByRank(s), [s]);
  return (
    <section className="box">
      <div className="box-head">
        <h3>The ladder</h3>
        <button type="button" className="btn small" onClick={onEdit}>
          Edit
        </button>
      </div>
      <ol className="renown-ladder-view">
        {ranks.map((r, i) => {
          const o = opens[i];
          const line = opensLine(o);
          return (
            <li key={i} className={i === rank ? "on" : i < rank ? "past" : undefined}>
              <div className="rl-head">
                <span className="rl-num">{i + 1}</span>
                <b>{r.name}</b>
                {i === rank ? <span className="tag">the party</span> : null}
                <span className="rl-pts note">{i === 0 ? "Where everyone starts" : `${r.points} points · ${r.points - ranks[i - 1].points} more than ${ranks[i - 1].name}`}</span>
              </div>
              {r.meaning || r.pay ? (
                <div className="note">
                  {r.meaning}
                  {r.meaning && r.pay ? " · " : ""}
                  {r.pay ? `jobs pay ${r.pay}` : ""}
                </div>
              ) : null}
              {i > 0 ? (
                line ? (
                  <details className="rl-opens">
                    <summary>Opens {line}</summary>
                    <ul>
                      {o.shops.map((x) => (
                        <li key={`s${x}`}>Storefront: {x}</li>
                      ))}
                      {o.items.map((x, k) => (
                        <li key={`i${k}`}>{x}</li>
                      ))}
                      {o.jobs.map((x, k) => (
                        <li key={`j${k}`}>Job: {x}</li>
                      ))}
                      {o.goodRoom ? <li>The Good Room at the inn</li> : null}
                    </ul>
                  </details>
                ) : (
                  <div className="note rl-opens-none">Nothing waits on this rank yet.</div>
                )
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

interface Row {
  key: number;
  /** The rank this was when the editor opened (null: new). */
  from: number | null;
  name: string;
  meaning: string;
  pay: string;
  raised: string;
  /** Running total. */
  total: number;
  /** What's typed in the points box while it isn't a good number yet. */
  typed?: string;
}

let rowKey = 0;
const toRows = (ladder: RenownRank[], from: boolean): Row[] => ladder.map((r, i) => ({ key: ++rowKey, from: from ? i : null, name: r.name, meaning: r.meaning, pay: r.pay, raised: r.raised, total: r.points }));

/** Keep the running totals rising: 0 first, each at least one more than the one before. */
function rising(rows: Row[]): Row[] {
  let prev = -1;
  return rows.map((r, i) => {
    const total = i === 0 ? 0 : Math.min(RENOWN_POINTS_MAX, Math.max(prev + 1, r.total));
    prev = total;
    return total === r.total ? r : { ...r, total };
  });
}

/** Every rank, editable: names, words, points; add, remove, move. */
function LadderEditor({ onClose }: { onClose: () => void }) {
  const { view, run, toast } = useDm();
  const s = view.state;
  const town = townOf(s);
  const [rows, setRows] = useState<Row[]>(() => toRows(ladderTemplate(s), true));
  const [perRank, setPerRank] = useState(true);
  const [saving, setSaving] = useState(false);
  const was = useMemo(() => ranksOf(s), [s]);
  const opens = useMemo(() => opensByRank(s), [s]);

  const patch = (i: number, p: Partial<Row>) => setRows((all) => all.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const setPoints = (i: number, text: string) => {
    const t = text.trim();
    const n = /^\d{1,3}$/.test(t) ? Number(t) : NaN;
    setRows((all) => {
      if (Number.isNaN(n) || (perRank && n < 1)) return all.map((r, j) => (j === i ? { ...r, typed: text } : r));
      if (!perRank) return all.map((r, j) => (j === i ? { ...r, total: n, typed: undefined } : r));
      // Per rank: this step changes, the later steps stay as they are.
      const delta = all[i - 1].total + n - all[i].total;
      return rising(all.map((r, j) => (j === i ? { ...r, total: r.total + delta, typed: undefined } : j > i ? { ...r, total: r.total + delta } : r)));
    });
  };
  const moveRow = (i: number, d: -1 | 1) =>
    setRows((all) => {
      const j = i + d;
      if (j < 0 || j >= all.length) return all;
      // The words move; the points stay with the step on the ladder.
      const out = all.slice();
      out[i] = { ...all[j], total: all[i].total, typed: undefined };
      out[j] = { ...all[i], total: all[j].total, typed: undefined };
      return out;
    });
  const addBelow = (i: number) =>
    setRows((all) => {
      if (all.length >= RENOWN_TIERS_MAX) return all;
      const last = i === all.length - 1;
      const total = last ? nextDefaultPoints(all.map((r) => r.total)) : Math.max(all[i].total + 1, Math.floor((all[i].total + all[i + 1].total) / 2));
      const row: Row = { key: ++rowKey, from: null, name: "", meaning: "", pay: "", raised: "", total };
      return rising([...all.slice(0, i + 1), row, ...all.slice(i + 1)]);
    });
  const removeRow = (i: number) => setRows((all) => (all.length <= RENOWN_TIERS_MIN ? all : rising(all.filter((_, j) => j !== i))));

  // What moves: ranks that are gone, and where their locks go.
  const moves = useMemo(() => {
    const kept = new Map(rows.flatMap((r, i) => (r.from === null ? [] : [[r.from, i] as const])));
    const target = (old: number) => {
      let j = old;
      while (j >= 0 && !kept.has(j)) j--;
      return j >= 0 ? kept.get(j)! : 0;
    };
    const lines: string[] = [];
    was.forEach((r, old) => {
      if (kept.has(old)) return;
      const to = rows[target(old)];
      const toName = to?.name.trim() ? fillTown(s, to.name.trim()) : `rank ${target(old) + 1}`;
      const what = opensLine(opens[old]);
      lines.push(`${r.name} goes.${what ? ` ${what[0].toUpperCase()}${what.slice(1)} will need ${toName} instead.` : ""}${old === renownOf(s) ? ` The party becomes ${toName}.` : ""}`);
    });
    return lines;
  }, [rows, was, opens, s]);

  const problem = (() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.name.trim()) return `Rank ${i + 1} needs a name.`;
      if (r.typed !== undefined) return `${r.name.trim()} needs a whole number of points${perRank && i ? ", at least 1" : ""}.`;
      if (i > 0 && r.total <= rows[i - 1].total) return `${r.name.trim()} needs more points than ${rows[i - 1].name.trim() || `rank ${i}`}.`;
      if (rows.findIndex((x) => x.name.trim().toLowerCase() === r.name.trim().toLowerCase()) !== i) return `Two ranks are called “${r.name.trim()}”.`;
    }
    return null;
  })();

  const save = async () => {
    if (problem) return void toast(problem);
    if (moves.length && !(await ask(`${moves.join(" ")} Save the new ladder?`))) return;
    setSaving(true);
    const ok = await run({ type: "game.renownLadder", ranks: rows.map((r, i) => ({ from: r.from, name: r.name, meaning: r.meaning, pay: r.pay, raised: r.raised, points: i === 0 ? 0 : r.total })) }, "Renown ladder saved.");
    setSaving(false);
    if (ok) onClose();
  };
  const reset = async () => {
    const d = defaultLadder(s);
    const fewer = was.length > d.length;
    if (!(await ask(`Go back to the default ${d.length} ranks (${d.map((r) => fillTown(s, r.name)).join(", ")}) with their usual points?${fewer ? " Anything that needs a rank above the fifth will need the fifth." : ""} Your own wording goes.`))) return;
    const ok = await run({ type: "game.renownLadder", reset: true }, "Back to the default ladder.");
    if (ok) onClose();
  };
  // A rank's place in the old ladder, for "was Trusted".
  const oldName = (r: Row, i: number) => (r.from === null ? "New rank" : r.from !== i ? `Was rank ${r.from + 1}` : null);

  return (
    <section className="box ladder-editor">
      <div className="box-head">
        <h3>Edit the ladder</h3>
        <div className="seg" role="group" aria-label="Type points as">
          <button type="button" className={`btn small${perRank ? " on" : ""}`} aria-pressed={perRank} onClick={() => setPerRank(true)}>
            Points per rank
          </button>
          <button type="button" className={`btn small${!perRank ? " on" : ""}`} aria-pressed={!perRank} onClick={() => setPerRank(false)}>
            Running total
          </button>
        </div>
      </div>
      <p className="note">
        {RENOWN_TIERS_MIN} to {RENOWN_TIERS_MAX} ranks, lowest first. Type <code>{"{town}"}</code> for the town&rsquo;s name ({town || "not named yet"}). An empty box shows nothing to players; an empty TV line uses the rank&rsquo;s name. Moving a rank moves its words; the points stay with the step.
      </p>
      <ol className="ladder-rows">
        {rows.map((r, i) => {
          const step = i ? r.total - rows[i - 1].total : 0;
          const note = oldName(r, i);
          return (
            <li key={r.key} className="ladder-row">
              <div className="ladder-row-head">
                <span className="rl-num">{i + 1}</span>
                <input className="fld ladder-name" aria-label={`Rank ${i + 1} name`} maxLength={40} placeholder="Name this rank" value={r.name} onChange={(e) => patch(i, { name: e.target.value })} />
                {note ? <span className="tag">{note}</span> : null}
                <div className="ladder-row-tools">
                  <button type="button" className="btn small" aria-label={`Move ${r.name || `rank ${i + 1}`} to a lower rank`} title="Move up the list (a lower rank)" disabled={i === 0} onClick={() => moveRow(i, -1)}>
                    ↑
                  </button>
                  <button type="button" className="btn small" aria-label={`Move ${r.name || `rank ${i + 1}`} to a higher rank`} title="Move down the list (a higher rank)" disabled={i === rows.length - 1} onClick={() => moveRow(i, 1)}>
                    ↓
                  </button>
                  <button type="button" className="btn small danger" disabled={rows.length <= RENOWN_TIERS_MIN} onClick={() => removeRow(i)}>
                    Remove
                  </button>
                </div>
              </div>
              <div className="ladder-row-fields">
                <label>
                  What it means
                  <input className="fld" maxLength={120} value={r.meaning} onChange={(e) => patch(i, { meaning: e.target.value })} />
                </label>
                <label>
                  Jobs pay
                  <input className="fld" maxLength={40} value={r.pay} onChange={(e) => patch(i, { pay: e.target.value })} />
                </label>
                <label>
                  TV line when reached
                  <input className="fld" maxLength={80} placeholder={r.name ? fillTown(s, r.name) : ""} value={r.raised} onChange={(e) => patch(i, { raised: e.target.value })} />
                </label>
                {i > 0 ? (
                  <label className="ladder-points">
                    {perRank ? "Points for this rank" : "Points to reach (total)"}
                    <input className="fld amt" inputMode="numeric" value={r.typed ?? String(perRank ? step : r.total)} onChange={(e) => setPoints(i, e.target.value)} />
                    <span className="note">{perRank ? `${r.total} in all` : `${step} more than ${rows[i - 1].name.trim() || `rank ${i}`}`}</span>
                  </label>
                ) : (
                  <div className="ladder-points note">Everyone starts here (0 points).</div>
                )}
              </div>
              {rows.length < RENOWN_TIERS_MAX ? (
                <button type="button" className="btn small ladder-add" onClick={() => addBelow(i)}>
                  {i === rows.length - 1 ? "+ Add a higher rank" : "+ Add a rank between these"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {moves.length ? (
        <div className="ladder-moves" role="status">
          {moves.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      ) : null}
      {(() => {
        // Lower thresholds: the party might already have enough for a higher rank.
        const pts = pointsOf(s);
        const reach = rows.reduce((best, r, i) => (pts >= (i ? r.total : 0) ? i : best), 0);
        const rankNow = renownOf(s);
        const mapped = rows.findIndex((r) => r.from === rankNow);
        return mapped >= 0 && reach > mapped ? <p className="note">On this ladder the party&rsquo;s {pts} points reach {rows[reach].name.trim() || `rank ${reach + 1}`}. After saving you can raise them, or they go up the next time they earn points.</p> : null;
      })()}
      {problem ? <p className="note ladder-problem">{problem}</p> : null}
      <div className="inline">
        <button type="button" className="btn primary" disabled={saving} onClick={() => void save()}>
          Save the ladder
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn" onClick={() => void reset()} disabled={!s.renownLadder && !s.renownRanks}>
          Back to the default ladder
        </button>
      </div>
    </section>
  );
}
