"use client";

// The DM's Board tab: the notice board itself (every note placed by hand),
// the party's Renown, and the bounty board's job flyers with their payouts.

import { TrustSelect } from "./TrustSelect";
import { BoardCanvas, LookFields, useScrollIn } from "./BoardCanvas";
import { useMemo, useState } from "react";
import { cpToGpInput, formatCp, parseAmount } from "@/shared/money";
import { jobWhen, type PublicJob } from "@/shared/projection";
import { defaultPayout, jobsOf, jobTitle, payoutPlayers, rankName, ranksOf, renownOf } from "@/shared/renown";
import type { Job, JobReward, JobStatus, JobStyle, NoteLook, TrustNeed } from "@/shared/types";
import { JobCard, STYLE_LABELS, whenLabel } from "../scenes/Board";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { RenownControl } from "./RenownControl";
import { PlusIcon } from "./navIcons";

const STATUS_LABELS: Record<JobStatus, string> = { open: "Open", taken: "Taken", done: "Done", expired: "Pulled" };

export function BoardPanel() {
  const { view } = useDm();
  const s = view.state;
  const jobs = jobsOf(s);
  const [editing, setEditing] = useState<{ id: string | null; followUpOf?: string } | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const editJob = editing?.id ? jobs.find((j) => j.id === editing.id) : undefined;
  const followOf = editing?.followUpOf ? jobs.find((j) => j.id === editing.followUpOf) : undefined;
  const payJob = paying ? jobs.find((j) => j.id === paying) : undefined;

  const n = (st: JobStatus) => jobs.filter((j) => j.status === st).length;
  const newJob = () => (setPaying(null), setEditing({ id: null }));

  return (
    <div className="pg board-page">
      <PageHead
        title="Notice board"
        sub="The TV's board, the party's Renown and the job flyers."
        help={
          <>
            <p>Drag a note to move it, the round handle to tilt it, the side handle to make it wider. Double-click to edit. Changes go to the TV when you let go. Notes in the drawer never leave this screen.</p>
            <p>Pinned jobs show on the TV&rsquo;s notice board and on phones. Jobs above the party&rsquo;s Renown stay readable, stamped &ldquo;Experienced parties only&rdquo;. Your notes (adventure, loot, twists) never leave this screen.</p>
          </>
        }
        actions={
          <button type="button" className="btn primary" onClick={newJob}>
            <PlusIcon size={16} /> Job flyer
          </button>
        }
        stats={[
          { label: "Renown", value: rankName(renownOf(s), s), tone: "gold" },
          { label: "Open jobs", value: n("open") },
          { label: "Taken", value: n("taken"), tone: n("taken") ? "warn" : "muted" },
          { label: "Done", value: n("done"), tone: "muted" },
        ]}
      />
    <div className="panel-grid">
      <BoardCanvas onEditJob={(id) => (setPaying(null), setEditing({ id }))} onNewJob={() => (setPaying(null), setEditing({ id: null }))} />
      {editing ? <JobEditor key={`${editing.id ?? "new"}-${editing.followUpOf ?? ""}`} job={editJob} followUpOf={followOf} onClose={() => setEditing(null)} /> : null}
      <RenownBox />
      <PlayerFlyers />
      <section className="box board-wide">
        <div className="box-head">
          <h3>Job flyers</h3>
        </div>
        {jobs.length === 0 ? <p className="note">No job flyers yet. Add one with + Job flyer at the top.</p> : null}
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
    </div>
  );
}

function RenownBox() {
  const { view, run } = useDm();
  const rank = renownOf(view.state);
  const ranks = ranksOf(view.state);
  return (
    <section className="box">
      <h3>Renown</h3>
      <p className="note">One rank for the whole party. Raising it plays a moment on the TV (untick the box to skip it), writes it in the Chronicle, and opens anything that was waiting on it. Lowering it is quiet, and those things lock again. You can also change it from the ❦ button in the top bar.</p>
      <ol className="renown-ladder">
        {ranks.map((r, i) => (
          <li key={r.name} className={i === rank ? "on" : i < rank ? "past" : undefined}>
            <span>
              <b>{r.name}</b> <span className="note">· {r.meaning}</span>
            </span>
            <span className="note">{r.pay}</span>
          </li>
        ))}
      </ol>
      <RenownControl />
      <RankWords />
    </section>
  );
}

const RANK_FIELDS = [
  { k: "name", label: "Rank", max: 40 },
  { k: "meaning", label: "What it means", max: 120 },
  { k: "pay", label: "Jobs pay", max: 40 },
  { k: "raised", label: "TV line when reached", max: 80 },
] as const;

/** Reword the five ranks for this campaign. A blank box keeps the default text. */
function RankWords() {
  const { view, run } = useDm();
  const s = view.state;
  const defaults = ranksOf({ town: s.town });
  const [d, setD] = useState(() => defaults.map((_, i) => ({ ...(s.renownRanks?.[i] ?? {}) }) as Record<string, string | undefined>));
  const save = () => run({ type: "game.renownRanks", ranks: d }, "Renown ranks saved.");
  return (
    <details className="rank-words">
      <summary>Reword the ranks for this campaign</summary>
      <p className="note">Leave a box empty to keep the text shown in grey. Every campaign has five ranks.</p>
      {defaults.map((r, i) => (
        <fieldset key={i} className="rank-words-row">
          <legend>Rank {i + 1}</legend>
          {RANK_FIELDS.map((f) => (
            <label key={f.k}>
              {f.label}
              <input
                className="fld"
                maxLength={f.max}
                placeholder={r[f.k]}
                value={d[i][f.k] ?? ""}
                onChange={(e) => setD((all) => all.map((x, j) => (j === i ? { ...x, [f.k]: e.target.value } : x)))}
              />
            </label>
          ))}
        </fieldset>
      ))}
      <div className="inline">
        <button type="button" className="btn primary" onClick={save}>
          Save ranks
        </button>
        <button type="button" className="btn" onClick={() => setD(defaults.map(() => ({})))}>
          Clear all
        </button>
      </div>
    </details>
  );
}

function JobRow({ job: j, onEdit, onFollowUp, onPay }: { job: Job; onEdit: () => void; onFollowUp: () => void; onPay: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const name = j.style === "sealed" ? `Sealed envelope${j.title ? `: ${j.title}` : ""}` : j.title;
  const when = jobWhen(s, j);
  const reward = j.reward.kind === "hidden" ? "reward hidden" : `${formatCp(j.reward.cp)} ${j.reward.kind}`;
  return (
    <div className="board-row">
      <div className="board-row-main">
        <div>
          <b>{name}</b> {j.pinned ? <span className="tag">pinned</span> : null}
        </div>
        <div className="note">
          {STYLE_LABELS[j.style]} · {reward} · needs {rankName(j.renown, s)}
          {when ? ` · ${j.status === "done" ? "done" : "taken"} ${when.chapter !== undefined ? "in" : "on"} ${whenLabel(when)}` : ""}
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
  trust: TrustNeed | null;
  style: JobStyle;
  look: NoteLook;
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
    trust: j?.trust ?? null,
    style: j?.style ?? "scrawl",
    look: structuredClone(j?.look ?? {}),
    adventure: j?.dm.adventure ?? "",
    loot: j?.dm.loot ?? "",
    twists: j?.dm.twists ?? "",
    notes: j?.dm.notes ?? "",
  };
}

/** Write or edit a job flyer, with a live preview in each paper. */
function JobEditor({ job, followUpOf, onClose }: { job?: Job; followUpOf?: Job; onClose: () => void }) {
  const { view, call, toast } = useDm();
  const ranks = ranksOf(view.state);
  const scrollIn = useScrollIn();
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
    look: d.look,
    style,
    status: "open",
    title: style === "sealed" ? "" : d.title.trim() || "Help wanted",
    postedBy: style === "sealed" ? "" : d.postedBy,
    body: style === "sealed" ? "" : d.body,
    reward: d.rewardKind === "hidden" || !rewardCp ? null : { kind: d.rewardKind, cp: rewardCp },
    ...(d.renown > rank ? { needs: rankName(d.renown, view.state) } : {}),
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
      trust: d.trust,
      style: d.style,
      look: d.look,
      dm: { adventure: d.adventure, loot: d.loot, twists: d.twists, notes: d.notes },
    };
    const r = job ? await call({ type: "job.update", jobId: job.id, patch: body }) : await call({ type: "job.add", job: body, ...(followUpOf ? { followUpOf: followUpOf.id } : {}) });
    if (r.error) return toast(r.error);
    toast(job ? "Saved." : followUpOf ? "Follow-up written. The old flyer is pulled." : "Flyer written. Pin it up when you're ready.");
    onClose();
  };

  return (
    <div ref={scrollIn} className="box board-editor board-wide" role="group" aria-label={job ? "Edit job flyer" : "New job flyer"}>
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
              {ranks.map((r, i) => (
                <option key={r.name} value={i}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <TrustSelect value={d.trust} onChange={(v) => set("trust", v)} />
        </div>
        {rewardCp === null ? <p className="note">That isn&rsquo;t an amount I can read.</p> : null}
      </div>

      <div className="board-editor-split">
        <LookFields style={d.style} setStyle={(v) => set("style", v)} look={d.look} setLook={(v) => set("look", v)} />
        <div className="board-editor-preview">
          <div style={{ width: `${job?.place?.w ?? (d.style === "handbill" ? 520 : d.style === "sealed" ? 300 : 330)}px` }}>
            <JobCard job={preview(d.style)} page />
          </div>
        </div>
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
