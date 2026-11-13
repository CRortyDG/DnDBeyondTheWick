"use client";

import { useState } from "react";
import type { ChronicleAuthor } from "@/shared/chronicle";
import { Chronicle } from "../ui/Chronicle";
import { useDm } from "./context";

/** The DM's Chronicle: every note, with stars, hiding and the note-taker. */
export function ChroniclePanel() {
  const { view, call } = useDm();
  return (
    <div className="chron-dm">
      <p className="note">
        The table&rsquo;s shared story notes. Players see everything here except notes you hide, and your recap once a session has ended. Star the notes that matter; you can put starred notes on the TV with &ldquo;Previously on&hellip;&rdquo;.
      </p>
      <ManageAuthors authors={view.chronicle.authors ?? []} />
      <Chronicle view={view.chronicle} gameName={view.state.name} send={async (c) => (await call(c as never)).error} />
    </div>
  );
}

const STATUS: Record<ChronicleAuthor["status"], string> = {
  player: "",
  left: "left the table",
  deleted: "deleted player",
  dm: "you",
};

/** Hide or delete everything one person wrote, e.g. a player who's no longer in the game. */
function ManageAuthors({ authors }: { authors: ChronicleAuthor[] }) {
  const { call, toast } = useDm();
  const [confirm, setConfirm] = useState<string | null>(null);
  if (!authors.length) return null;
  const gone = authors.filter((a) => a.status === "deleted").length;
  const act = async (cmd: Parameters<typeof call>[0]) => {
    const r = await call(cmd);
    toast(r.error ?? r.info ?? "Done.");
    setConfirm(null);
  };
  return (
    <details className="box chron-manage" open={gone > 0 ? true : undefined}>
      <summary>
        Manage the Chronicle
        {gone ? <span className="tag wax">{gone === 1 ? "1 deleted player still has notes" : `${gone} deleted players still have notes`}</span> : null}
      </summary>
      <p className="note">Everyone who has written in the Chronicle. Hiding takes their notes off every phone and the TV but keeps them for you; deleting removes them for good.</p>
      <ul className="chron-authors">
        {authors.map((a) => {
          const shown = a.notes - a.hidden;
          return (
            <li key={a.id}>
              <span className="chron-authors-who">
                <b>{a.name}</b>
                {STATUS[a.status] ? <span className={`tag${a.status === "deleted" ? " wax" : ""}`}>{STATUS[a.status]}</span> : null}
                <span className="note">
                  {a.notes} note{a.notes === 1 ? "" : "s"}
                  {a.hidden ? `, ${a.hidden} hidden` : ""}
                </span>
              </span>
              <span className="chron-authors-acts">
                {shown > 0 ? (
                  <button type="button" className="btn small" onClick={() => void act({ type: "note.hideAuthor", authorId: a.id, hidden: true })}>
                    Hide all
                  </button>
                ) : (
                  <button type="button" className="btn small" onClick={() => void act({ type: "note.hideAuthor", authorId: a.id, hidden: false })}>
                    Show all
                  </button>
                )}
                {confirm === a.id ? (
                  <>
                    <button type="button" className="btn small danger" onClick={() => void act({ type: "note.removeAuthor", authorId: a.id })}>
                      Yes, delete {a.notes}
                    </button>
                    <button type="button" className="btn small" onClick={() => setConfirm(null)}>
                      Keep them
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn small danger" onClick={() => setConfirm(a.id)}>
                    Delete all
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
