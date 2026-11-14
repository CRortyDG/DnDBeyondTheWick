// The notice board's pinned layer: job flyers and player flyers share the same
// pin slots, in different papers. Positions are on the 1920x1080 board.
import { formatCp } from "@/shared/money";
import type { PublicFlyer, PublicJob, PublicRenown } from "@/shared/projection";
import type { JobStyle } from "@/shared/types";

/** Where flyers get pinned: left, top, tilt. The earliest pinned get the first slots. */
const SLOTS: [number, number, number][] = [
  [1300, 290, -4],
  [110, 290, 3],
  [990, 600, -3],
  [1580, 250, 4],
  [1460, 640, 3],
  [330, 760, -2],
  [700, 520, 2],
  [1620, 700, -4],
];
export const MAX_FLYERS = SLOTS.length;

export interface BoardView {
  flyers: PublicFlyer[];
  jobs: PublicJob[];
  renown?: PublicRenown;
}

type Card = { kind: "flyer"; at: number; f: PublicFlyer } | { kind: "job"; at: number; j: PublicJob };

/** Everything pinned, in the order it went up. */
export function Pinned({ board }: { board?: BoardView }) {
  if (!board) return null;
  const cards: Card[] = [...board.flyers.map((f): Card => ({ kind: "flyer", at: f.at, f })), ...board.jobs.map((j): Card => ({ kind: "job", at: j.at, j }))]
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_FLYERS);
  return (
    <>
      {cards.map((c, i) => {
        const [left, top, tilt] = SLOTS[i];
        const style = { left: `${left}px`, top: `${top}px`, transform: `rotate(${tilt}deg)` };
        if (c.kind === "job") return <JobCard key={c.j.id} job={c.j} style={style} />;
        const f = c.f;
        return (
          <div key={f.id} className={`flyer${i % 2 ? " alt" : ""}`} style={style}>
            <div className="flyer-title">{f.title}</div>
            {f.body ? <div className="flyer-body">{f.body}</div> : null}
            <div className="flyer-sign">{f.signedBy}</div>
          </div>
        );
      })}
      {board.renown ? <RenownPlaque renown={board.renown} /> : null}
    </>
  );
}

/** A small plaque on the board's frame: who Candlefair thinks you are. */
export function RenownPlaque({ renown }: { renown: PublicRenown }) {
  return (
    <div className="renown-plaque" aria-label={`Renown: ${renown.name}`}>
      <span className="renown-plaque-kicker">The party</span>
      <span className="renown-plaque-name">{renown.name}</span>
    </div>
  );
}

export const STYLE_LABELS: Record<JobStyle, string> = {
  scrawl: "Scrawled note",
  bill: "Merchant’s bill",
  official: "Official notice",
  sealed: "Sealed envelope",
};

export function rewardLine(r: PublicJob["reward"]): string | null {
  if (!r) return null;
  return `${formatCp(r.cp)} ${r.kind === "each" ? "each" : "for the party"}`;
}

/** One job flyer, in its paper. Stamped TAKEN, DONE, or "Experienced parties only". */
export function JobCard({ job: j, style, page }: { job: PublicJob; style?: React.CSSProperties; page?: boolean }) {
  const reward = rewardLine(j.reward);
  const stamp = j.status === "taken" ? "Taken" : j.status === "done" ? "Done" : j.needs ? "Experienced parties only" : null;
  const label = j.style === "sealed" ? "A sealed envelope" : j.title;
  return (
    <div className={`job job-${j.style}${page ? " job-page" : ""}`} style={style} role="figure" aria-label={`${label}${stamp ? ` (${stamp})` : ""}`}>
      {j.style === "sealed" ? (
        <>
          <div className="job-flap" />
          <div className="job-wax" aria-hidden="true">
            ✦
          </div>
          {reward ? <div className="job-reward">{reward}</div> : null}
        </>
      ) : (
        <>
          {j.style === "official" ? <div className="job-kicker">By order of the council</div> : null}
          {j.style === "bill" ? <div className="job-kicker">Wanted · Reward</div> : null}
          <div className="job-title">{j.title}</div>
          {j.body ? <div className="job-body">{j.body}</div> : null}
          {reward ? <div className="job-reward">{reward}</div> : null}
          {j.postedBy ? <div className="job-by">{j.postedBy}</div> : null}
          {j.style === "official" ? <div className="job-seal" aria-hidden="true" /> : null}
        </>
      )}
      {stamp ? (
        <div className={`job-stamp stamp-${j.status === "open" ? "locked" : j.status}`}>
          {stamp}
          {j.status === "open" && j.needs ? <small>{j.needs}</small> : null}
        </div>
      ) : null}
    </div>
  );
}
