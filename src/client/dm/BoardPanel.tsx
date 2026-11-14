"use client";

// The DM's Board tab: the party's Renown, and the bounty board's job flyers
// (with player flyers, which share the same eight pins).

import { useMemo, useState } from "react";
import { cpToGpInput, formatCp, parseAmount } from "@/shared/money";
import type { PublicJob } from "@/shared/projection";
import { BOARD_SLOTS, defaultPayout, jobsOf, jobTitle, payoutPlayers, pinnedCount, rankName, RENOWN, renownOf } from "@/shared/renown";
import type { Job, JobReward, JobStatus, JobStyle } from "@/shared/types";
import { JobCard, STYLE_LABELS } from "../scenes/Board";
import { useDm } from "./context";

const STATUS_LABELS: Record<JobStatus, string> = { open: "Open", taken: "Taken", done: "Done", expired: "Pulled" };
const STYLES: JobStyle[] = ["scrawl", "bill", "official", "sealed"];

export function BoardPanel() {
  const { view } = useDm();
  const s = view.state;
  const jobs = jobsOf(s);
  const [editing, setEditing] = useState<{ id: string | null; followUpOf?: string } | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const editJob = editing?.id ? jobs.find((j) => j.id === editing.id) : undefined;
  const followOf = editing?.followUpOf ? jobs.find((j) => j.id === editing.followUpOf) : undefined;
  const payJob = paying ? jobs.find((j) => j.id === paying) : undefined;

  return (
    <div className="panel-grid">
      <RenownBox />
      <PlayerFlyers />
      <section className="box board-wide">
        <div className="box-head">
          <h3>The bounty board</h3>
          <span className="note">
            {pinnedCount(s)} of {BOARD_SLOTS} pinned
          </span>
        </div>
        <p className="note">Pinned flyers show on the TV&rsquo;s notice board and on phones. Jobs above the party&rsquo;s Renown stay readable, stamped &ldquo;Experienced parties only&rdquo;. Your notes (adventure, loot, twists) never leave this screen.</p>
        <div className="inline">
          <button type="button" className="btn primary" onClick={() => (setPaying(null), setEditing({ id: null }))}>
            New job flyer
          </button>
        </div>
        {editing ? <JobEditor key={`${editing.id ?? "new"}-${editing.followUpOf ?? ""}`} job={editJob} followUpOf={followOf} onClose={() => setEditing(null)} /> : null}
        {payJob ? <PayoutForm key={payJob.id} job={payJob} onClose={() => setPaying(null)} /> : null}
        {(["open", "taken", "done", "expired"] as JobStatus[]).map((st) => {
          const list = jobs.filter((j) => j.status === st);
          if (!list.length) return null;
          return (
            <div key={st}>
              <h4>
                {STATUS_LABELS[st]} <span className="note">({list.length})</span>
              </h4>
              {list.map((j) => (
                <JobRow key={j.id} job={j} onEdit={() => (setPaying(null), setEditing({ id: j.id }))} onFollowUp={() => (setPaying(null), setEditing({ id: null, followUpOf: j.id }))} onPay={() => (setEditing(null), setPaying(j.id))} />
              ))}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function RenownBox() {
  const { view, run } = useDm();
  const rank = renownOf(view.state);
  const next = RENOWN[rank + 1];
  return (
    <section className="box">
      <h3>Renown</h3>
      <p className="note">One rank for the whole party. Raising it plays a moment on the TV, writes it in the Chronicle, and opens anything that was waiting on it. Lowering it is quiet, and those things lock again.</p>
      <ol className="renown-ladder">
        {RENOWN.map((r, i) => (
          <li key={r.name} className={i === rank ? "on" : i < rank ? "past" : undefined}>
            <span>
              <b>{r.name}</b> <span className="note">· {r.meaning}</span>
            </span>
            <span className="note">{r.pay}</span>
          </li>
        ))}
      </ol>
      <div className="inline">
        {next ? (
          <button type="button" className="btn primary" onClick={() => run({ type: "renown.set", rank: rank + 1 }, `The party is now ${next.name}.`)}>
            Raise to {next.name}
          </button>
        ) : null}
        <label>
          Set to
          <select className="fld" value={rank} onChange={(e) => run({ type: "renown.set", rank: Number(e.target.value) })}>
            {RENOWN.map((r, i) => (
              <option key={r.name} value={i}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function JobRow({ job: j, onEdit, onFollowUp, onPay }: { job: Job; onEdit: () => void; onFollowUp: () => void; onPay: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const name = j.style === "sealed" ? `Sealed envelope${j.title ? `: ${j.title}` : ""}` : j.title;
  const taker = j.takenBy?.[0] ? s.players.find((p) => p.id === j.takenBy![0])?.name : undefined;
  const reward = j.reward.kind === "hidden" ? "reward hidden" : `${formatCp(j.reward.cp)} ${j.reward.kind}`;
  return (
    <div className="board-row">
      <div className="board-row-main">
        <div>
          <b>{name}</b> {j.pinned ? <span className="tag">pinned</span> : null}
        </div>
        <div className="note">
          {STYLE_LABELS[j.style]} · {reward} · needs {rankName(j.renown)}
          {taker ? ` · taken by ${taker}` : ""}
          {j.status === "done" && j.paidCp !== undefined ? ` · paid ${formatCp(j.paidCp)}` : ""}
        </div>
        {j.dm.adventure ? <div className="note">Runs: {j.dm.adventure}</div> : null}
      </div>
      <div className="board-row-actions">
        {j.status !== "expired" ? (
          <button type="button" className={`btn small${j.pinned ? " on" : ""}`} aria-pressed={j.pinned} onClick={() => run({ type: "job.pin", jobId: j.id, pinned: !j.pinned })}>
            {j.pinned ? "Unpin" : "Pin up"}
          </button>
        ) : null}
        <button type="button" className="btn small" onClick={onEdit}>
          Edit
        </button>
        {j.status === "open" || j.status === "taken" ? (
          <button type="button" className="btn small" onClick={onPay}>
            Done&hellip;
          </button>
        ) : null}
        {j.status === "taken" ? (
          <button type="button" className="btn small" onClick={() => run({ type: "job.update", jobId: j.id, patch: { status: "open" } })}>
            Back to open
          </button>
        ) : null}
        {j.status === "open" || j.status === "taken" ? (
          <>
            <button type="button" className="btn small" onClick={() => run({ type: "job.expire", jobId: j.id }, "Pulled from the board.")}>
              Pull
            </button>
            <button type="button" className="btn small" onClick={onFollowUp}>
              Pull and follow up&hellip;
            </button>
          </>
        ) : null}
        {j.status === "expired" ? (
          <button type="button" className="btn small" onClick={() => run({ type: "job.update", jobId: j.id, patch: { status: "open" } })}>
            Reopen
          </button>
        ) : null}
        {!j.pinned ? (
          <button
            type="button"
            className="btn small danger"
            onClick={() => {
              if (confirm(`Throw away “${jobTitle(j)}”? Your notes on it go too.`)) void run({ type: "job.remove", jobId: j.id });
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface Draft {
  title: string;
  postedBy: string;
  body: string;
  rewardKind: JobReward["kind"];
  reward: string;
  renown: number;
  style: JobStyle;
  adventure: string;
  loot: string;
  twists: string;
  notes: string;
}

function draftOf(j?: Job): Draft {
  return {
    title: j?.title ?? "",
    postedBy: j?.postedBy ?? "",
    body: j?.body ?? "",
    rewardKind: j?.reward.kind ?? "each",
    reward: j && j.reward.kind !== "hidden" ? cpToGpInput(j.reward.cp) : "",
    renown: j?.renown ?? 0,
    style: j?.style ?? "scrawl",
    adventure: j?.dm.adventure ?? "",
    loot: j?.dm.loot ?? "",
    twists: j?.dm.twists ?? "",
    notes: j?.dm.notes ?? "",
  };
}

/** Write or edit a job flyer, with a live preview in each paper. */
function JobEditor({ job, followUpOf, onClose }: { job?: Job; followUpOf?: Job; onClose: () => void }) {
  const { view, call, toast } = useDm();
  const rank = renownOf(view.state);
  const [d, setD] = useState<Draft>(() => {
    if (job) return draftOf(job);
    // A follow-up starts from the flyer it replaces.
    if (followUpOf) return { ...draftOf(followUpOf), title: followUpOf.title ? `${followUpOf.title} (again)` : "" };
    return draftOf();
  });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const rewardCp = d.rewardKind === "hidden" ? 0 : parseAmount(d.reward || "0");

  const preview = (style: JobStyle): PublicJob => ({
    id: `preview-${style}`,
    style,
    status: "open",
    title: style === "sealed" ? "" : d.title.trim() || "Help wanted",
    postedBy: style === "sealed" ? "" : d.postedBy,
    body: style === "sealed" ? "" : d.body,
    reward: d.rewardKind === "hidden" || !rewardCp ? null : { kind: d.rewardKind, cp: rewardCp },
    ...(d.renown > rank ? { needs: rankName(d.renown) } : {}),
    at: 0,
  });

  const save = async () => {
    if (rewardCp === null) return toast("Enter the reward, like 50 or 12 gp 5 sp.");
    const body = {
      title: d.title,
      postedBy: d.postedBy,
      body: d.body,
      reward: { kind: d.rewardKind, cp: rewardCp },
      renown: d.renown,
      style: d.style,
      dm: { adventure: d.adventure, loot: d.loot, twists: d.twists, notes: d.notes },
    };
    const r = job ? await call({ type: "job.update", jobId: job.id, patch: body }) : await call({ type: "job.add", job: body, ...(followUpOf ? { followUpOf: followUpOf.id } : {}) });
    if (r.error) return toast(r.error);
    toast(job ? "Saved." : followUpOf ? "Follow-up written. The old flyer is pulled." : "Flyer written. Pin it up when you're ready.");
    onClose();
  };

  return (
    <div className="box board-editor" role="group" aria-label={job ? "Edit job flyer" : "New job flyer"}>
      <h4>{job ? "Edit job flyer" : followUpOf ? `Follow-up to “${jobTitle(followUpOf)}”` : "New job flyer"}</h4>
      <div className="form">
        <label>
          Title
          <input className="fld" value={d.title} maxLength={80} onChange={(e) => set("title", e.target.value)} placeholder={d.style === "sealed" ? "Only you see this on a sealed envelope" : "My brother is being held for ransom"} />
        </label>
        <label>
          Posted by
          <input className="fld" value={d.postedBy} maxLength={80} onChange={(e) => set("postedBy", e.target.value)} placeholder="Rolf Twyrtho, trader" />
        </label>
        <label>
          Text (a few lines, in the poster&rsquo;s voice)
          <textarea className="fld" rows={4} value={d.body} maxLength={600} onChange={(e) => set("body", e.target.value)} />
        </label>
        <div className="inline">
          <label>
            Reward
            <select className="fld" value={d.rewardKind} onChange={(e) => set("rewardKind", e.target.value as JobReward["kind"])}>
              <option value="each">per person</option>
              <option value="total">for the party</option>
              <option value="hidden">hidden</option>
            </select>
          </label>
          {d.rewardKind !== "hidden" ? (
            <label>
              Amount
              <input className="fld amt" inputMode="decimal" value={d.reward} onChange={(e) => set("reward", e.target.value)} placeholder="50" />
            </label>
          ) : null}
          <label>
            Needs Renown
            <select className="fld" value={d.renown} onChange={(e) => set("renown", Number(e.target.value))}>
              {RENOWN.map((r, i) => (
                <option key={r.name} value={i}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {rewardCp === null ? <p className="note">That isn&rsquo;t an amount I can read.</p> : null}
      </div>

      <p className="note">Paper (tap one):</p>
      <div className="board-previews" role="radiogroup" aria-label="Paper style">
        {STYLES.map((st) => (
          <div
            key={st}
            role="radio"
            tabIndex={0}
            aria-checked={d.style === st}
            aria-label={STYLE_LABELS[st]}
            className={`board-preview${d.style === st ? " on" : ""}`}
            onClick={() => set("style", st)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                set("style", st);
              }
            }}
          >
            <JobCard job={preview(st)} page />
            <span className="note">{STYLE_LABELS[st]}</span>
          </div>
        ))}
      </div>

      <h4>Only you see these</h4>
      <div className="form">
        <label>
          Adventure it runs
          <input className="fld" value={d.adventure} maxLength={300} onChange={(e) => set("adventure", e.target.value)} placeholder="e.g. a published adventure and chapter" />
        </label>
        <label>
          Expected loot
          <textarea className="fld" rows={2} value={d.loot} maxLength={1000} onChange={(e) => set("loot", e.target.value)} />
        </label>
        <label>
          Twists
          <textarea className="fld" rows={2} value={d.twists} maxLength={1000} onChange={(e) => set("twists", e.target.value)} />
        </label>
        <label>
          Notes
          <textarea className="fld" rows={2} value={d.notes} maxLength={2000} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </div>
      <div className="inline">
        <button type="button" className="btn primary" onClick={() => void save()}>
          {job ? "Save" : followUpOf ? "Pull the old one and post this" : "Write the flyer"}
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Mark a job done and pay it out: the reward per player in the session by default. */
function PayoutForm({ job, onClose }: { job: Job; onClose: () => void }) {
  const { view, call, toast } = useDm();
  const s = view.state;
  const seated = s.players.filter((p) => !p.archived);
  const initial = useMemo(() => {
    const ids = payoutPlayers(s);
    const by = new Map(defaultPayout(job, ids).map((x) => [x.playerId, x.cp]));
    return Object.fromEntries(seated.map((p) => [p.id, by.has(p.id) ? cpToGpInput(by.get(p.id)!) : ""]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);
  const [amounts, setAmounts] = useState<Record<string, string>>(initial);
  const parsed = seated.map((p) => ({ playerId: p.id, name: p.name, cp: (amounts[p.id] ?? "").trim() ? parseAmount(amounts[p.id]) : 0 }));
  const bad = parsed.some((x) => x.cp === null);
  const total = parsed.reduce((a, x) => a + (x.cp ?? 0), 0);

  const confirmDone = async () => {
    if (bad) return toast("One of those amounts isn't one I can read.");
    const r = await call({ type: "job.done", jobId: job.id, payouts: parsed.filter((x) => (x.cp ?? 0) > 0).map((x) => ({ playerId: x.playerId, cp: x.cp! })) });
    if (r.error) return toast(r.error);
    toast(total ? `Done. Paid ${formatCp(total)} into purses.` : "Marked done.");
    onClose();
  };

  return (
    <div className="box board-editor" role="group" aria-label="Mark the job done">
      <h4>Done: {jobTitle(job)}</h4>
      <p className="note">
        {job.reward.kind === "each" ? `The flyer says ${formatCp(job.reward.cp)} each, so everyone at the table gets that.` : job.reward.kind === "total" ? `The flyer says ${formatCp(job.reward.cp)} for the party, split evenly.` : "The reward was hidden: type what each player gets."} Change any amount, or clear it to leave someone out. It goes into purses through the ledger, once.
      </p>
      <div className="payout-grid">
        {parsed.map((x) => (
          <label key={x.playerId} style={{ display: "contents" }}>
            <span>{x.name}</span>
            <input className="fld amt" inputMode="decimal" value={amounts[x.playerId] ?? ""} onChange={(e) => setAmounts((a) => ({ ...a, [x.playerId]: e.target.value }))} placeholder="0" aria-label={`Pay ${x.name}`} />
          </label>
        ))}
      </div>
      <div className="inline">
        <button type="button" className="btn primary" onClick={() => void confirmDone()} disabled={bad}>
          Mark done{total ? ` and pay ${formatCp(total)}` : ""}
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function PlayerFlyers() {
  const { view, run } = useDm();
  const flyers = view.state.flyers;
  return (
    <section className="box">
      <h3>Player flyers</h3>
      {!flyers.length ? <p className="note">None yet. Players post them with &ldquo;Post on the notice board&rdquo; at the Candle; you approve them in Requests.</p> : null}
      {flyers
        .slice()
        .reverse()
        .map((f) => (
          <div key={f.id} className="board-row">
            <div className="board-row-main">
              <b>{f.title}</b> {f.up ? <span className="tag">pinned</span> : null}
              <div className="note">{f.signedBy}</div>
            </div>
            <div className="board-row-actions">
              <button type="button" className={`btn small${f.up ? " on" : ""}`} onClick={() => run({ type: "flyer.update", flyerId: f.id, patch: { up: !f.up } })}>
                {f.up ? "Unpin" : "Pin up"}
              </button>
              {!f.up ? (
                <button type="button" className="btn small danger" onClick={() => run({ type: "flyer.remove", flyerId: f.id })}>
                  Throw away
                </button>
              ) : null}
            </div>
          </div>
        ))}
    </section>
  );
}
