// The notice board's notes: plain notices, job flyers and player flyers, each
// hanging where the DM put it. Positions are on the cork (see shared/board.ts).
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { isJobPaper, LEGACY_SLOTS, PAPERS, type NoteKind } from "@/shared/board";
import { formatCp } from "@/shared/money";
import type { JobWhen, PublicFlyer, PublicJob, PublicNotice, PublicRenown } from "@/shared/projection";
import type { JobStyle, NoteLook, NotePlace, PinColor } from "@/shared/types";

export interface BoardView {
  flyers: PublicFlyer[];
  jobs: PublicJob[];
  notices?: PublicNotice[];
  renown?: PublicRenown;
  plaqueHidden?: boolean;
}

/** What any note shows: its paper and words. */
export interface NoteFaceData {
  style: JobStyle;
  title: string;
  body: string;
  sign: string;
  look?: NoteLook;
}

export type BoardCard = { kind: NoteKind; id: string; place: NotePlace; render: (page?: boolean) => ReactNode };

const PIN_HEX: Record<Exclude<PinColor, "none">, string> = { red: "#7a2a1f", blue: "#3a4a5c", green: "#2e5a3a", black: "#2b2118", gold: "#c99a3a", cream: "#e9dcc0" };

/** Every note that's up, bottom of the stack first. A note made before free placement falls back to its old slot. */
export function boardCards(board: BoardView): BoardCard[] {
  const cards: BoardCard[] = [];
  const unplaced: { at: number; c: Omit<BoardCard, "place"> & { w: number } }[] = [];
  const add = (c: Omit<BoardCard, "place">, place: NotePlace | undefined, at: number, w: number) => (place ? cards.push({ ...c, place }) : unplaced.push({ at, c: { ...c, w } }));
  for (const n of board.notices ?? []) add({ kind: "notice", id: n.id, render: (page) => <NoteCard face={n} page={page} /> }, n.place, 0, 290);
  for (const j of board.jobs) add({ kind: "job", id: j.id, render: (page) => <JobCard job={j} page={page} /> }, j.place, j.at, j.style === "sealed" ? 300 : 330);
  board.flyers.forEach((f) => add({ kind: "flyer", id: f.id, render: (page) => <FlyerCard flyer={f} page={page} /> }, f.place, f.at, 290));
  unplaced
    .sort((a, b) => a.at - b.at)
    .forEach(({ c: { w, ...c } }, i) => {
      const [x, y, rot] = LEGACY_SLOTS[i % LEGACY_SLOTS.length];
      cards.push({ ...c, place: { x, y, rot, w, z: 1000 + i } });
    });
  return cards.sort((a, b) => a.place.z - b.place.z);
}

/** Where a note hangs, as a style. */
export function placeStyle(p: NotePlace): CSSProperties {
  return { left: `${p.x}px`, top: `${p.y}px`, width: `${p.w}px`, transform: `rotate(${p.rot}deg)`, zIndex: 10 + Math.min(p.z, 500) };
}

/** Everything up on the board, where the DM hung it. */
export function Pinned({ board }: { board?: BoardView }) {
  if (!board) return null;
  return (
    <>
      {boardCards(board).map((c) => (
        <div key={`${c.kind}-${c.id}`} className="pin-at" style={placeStyle(c.place)}>
          {c.render()}
        </div>
      ))}
      {board.renown && !board.plaqueHidden ? <RenownPlaque renown={board.renown} /> : null}
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

export const STYLE_LABELS = Object.fromEntries(PAPERS.map((p) => [p.id, p.label])) as Record<JobStyle, string>;

export function rewardLine(r: PublicJob["reward"]): string | null {
  if (!r) return null;
  return `${formatCp(r.cp)} ${r.kind === "each" ? "each" : "for the party"}`;
}

/** "Chapter 4", or the day when no session had started yet. */
export function whenLabel(w: JobWhen): string {
  return w.chapter !== undefined ? `Chapter ${w.chapter}` : new Date(w.at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** "Completed in Chapter 4" / "Taken by the party in Chapter 3". The party does jobs together, so no names. */
export function jobStatusLine(j: Pick<PublicJob, "status" | "when">): string | null {
  const w = j.when;
  const on = w ? (w.chapter !== undefined ? ` in ${whenLabel(w)}` : ` on ${whenLabel(w)}`) : "";
  if (j.status === "done") return `Completed${on}.`;
  if (j.status === "taken") return `Taken by the party${on}.`;
  return null;
}

/** One job flyer, in its paper. Stamped TAKEN, DONE, or "Experienced parties only". */
export function JobCard({ job: j, style, page }: { job: PublicJob; style?: CSSProperties; page?: boolean }) {
  const reward = rewardLine(j.reward);
  const stampText = j.status === "taken" ? "Taken" : j.status === "done" ? "Done" : j.needs ? "Experienced parties only" : j.goodwill ? "Not yet" : null;
  const label = j.style === "sealed" ? "A sealed envelope" : j.title;
  const stamp = stampText ? (
    <div className={`job-stamp stamp-${j.status === "open" ? "locked" : j.status}`}>
      {stampText}
      {j.status === "open" && (j.needs || j.goodwill) ? <small>{j.needs ?? `Needs ${j.goodwill}`}</small> : null}
      {j.status === "done" && j.when ? <small>{whenLabel(j.when)}</small> : null}
    </div>
  ) : null;
  return <NoteCard face={{ style: j.style, title: j.title, body: j.body, sign: j.postedBy, look: j.look }} reward={reward} stamp={stamp} style={style} page={page} label={`${label}${stampText ? ` (${stampText})` : ""}`} />;
}

/** A player's flyer: handwriting on cheap paper, unless the DM picked another paper. */
export function FlyerCard({ flyer: f, page }: { flyer: PublicFlyer; page?: boolean }) {
  if (f.style) return <NoteCard face={{ style: f.style, title: f.title, body: f.body, sign: f.signedBy, look: { font: "hand", ...f.look } }} page={page} />;
  return (
    <div className={`flyer${page ? " flyer-page" : ""}`} role="figure" aria-label={f.title}>
      <div className="flyer-title">{f.title}</div>
      {f.body ? <div className="flyer-body">{f.body}</div> : null}
      <div className="flyer-sign">{f.signedBy}</div>
    </div>
  );
}

/**
 * Any note, in any paper. The four job papers keep their bounty-board layout;
 * the rest are the papers the printed notices used.
 */
export function NoteCard({ face, reward, stamp, style, page, label }: { face: NoteFaceData; reward?: string | null; stamp?: ReactNode; style?: CSSProperties; page?: boolean; label?: string }) {
  const l = face.look ?? {};
  const st = face.style;
  const pin = l.pin && l.pin !== "none" ? PIN_HEX[l.pin] : undefined;
  const titleStyle: CSSProperties | undefined = l.titleSize ? { fontSize: `${l.titleSize}px` } : undefined;
  const ink = l.ink ? ` ink-${l.ink}` : "";
  const cls = [l.font ? `font-${l.font}` : "", l.align ? `align-${l.align}` : "", l.band ? "band" : "", l.pin === "none" ? "pin-none" : pin ? "has-pin" : "", page ? "note-page" : ""].filter(Boolean).join(" ");
  const css = { ...style, ...(pin ? ({ "--pin": pin } as CSSProperties) : {}) };
  const aria = label ?? (face.title || face.body.slice(0, 60) || STYLE_LABELS[st]);
  const list = l.list?.length ? (
    <>
      <div className="note-rule">
        <span>{l.listLabel || "Wanted"}</span>
      </div>
      <div className="note-list">
        {l.list.map((x, i) => (
          <div key={i}>
            {x.head ? <div className="note-list-head">{x.head}</div> : null}
            {x.text ? <div className="note-list-text">{x.text}</div> : null}
          </div>
        ))}
      </div>
    </>
  ) : null;
  const image = l.image ? <img className="note-img" src={l.image} alt="" draggable={false} /> : null;

  if (isJobPaper(st)) {
    const kicker = l.kicker ?? (st === "official" ? "By order of the council" : st === "bill" ? "Wanted · Reward" : "");
    return (
      <div className={`job job-${st}${page ? " job-page" : ""} ${cls}`} style={css} role="figure" aria-label={aria}>
        {st === "sealed" ? (
          <>
            <div className="job-flap" />
            <div className="job-wax" aria-hidden="true">
              ✦
            </div>
            {reward ? <div className="job-reward">{reward}</div> : null}
          </>
        ) : (
          <>
            {image}
            {kicker ? <div className={`job-kicker${ink}`}>{kicker}</div> : null}
            {face.title ? (
              <div className={`job-title${ink}`} style={titleStyle}>
                {face.title}
              </div>
            ) : null}
            {l.sub ? <div className="note-sub">{l.sub}</div> : null}
            {face.body ? <div className="job-body">{face.body}</div> : null}
            {list}
            {reward ? <div className="job-reward">{reward}</div> : null}
            {l.footer ? <div className="note-footer">{l.footer}</div> : null}
            {face.sign ? <div className="job-by">{face.sign}</div> : null}
            {l.signNote ? <div className="note-signnote">{l.signNote}</div> : null}
            {st === "official" ? <div className="job-seal" aria-hidden="true" /> : null}
          </>
        )}
        {stamp}
      </div>
    );
  }

  return (
    <div className={`note-card paper-${st} ${cls}`} style={css} role="figure" aria-label={aria}>
      <div className="note-inner">
        {image}
        {l.kicker ? <div className={`note-kicker${ink}`}>{l.kicker}</div> : null}
        {face.title ? (
          <div className={`note-title${ink}`} style={titleStyle}>
            {face.title}
          </div>
        ) : null}
        {l.sub ? <div className="note-sub">{l.sub}</div> : null}
        {face.body ? <div className="note-body">{face.body}</div> : null}
        {list}
        {reward ? <div className="note-reward">{reward}</div> : null}
        {l.footer ? <div className="note-footer">{l.footer}</div> : null}
        {face.sign ? <div className="note-sign">{face.sign}</div> : null}
        {l.signNote ? <div className="note-signnote">{l.signNote}</div> : null}
      </div>
      {stamp}
    </div>
  );
}

export type NotePointer = (kind: NoteKind, id: string, e: ReactPointerEvent<HTMLDivElement>) => void;
