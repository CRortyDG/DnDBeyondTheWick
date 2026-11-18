"use client";

import { Chronicle } from "../ui/Chronicle";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { LastTimeChapter } from "./LastTimeEditor";
import { GiveKeepsake } from "./Keepsakes";

/** The DM's Chronicle: every note, with stars, hiding and the note-taker. */
export function ChroniclePanel() {
  const { view, call } = useDm();
  const c = view.chronicle;
  return (
    <div className="chron-dm pg">
      <PageHead
        title="Chronicle"
        sub="The table's shared story notes, chapter by chapter."
        help={
          <p>
            Players see everything here except notes you hide, and your recap once a session has ended. Under each ended chapter you can edit and send the players&rsquo; &ldquo;Last time on&hellip;&rdquo; card. Star the notes that matter; you can put starred notes on the TV with &ldquo;Previously on&hellip;&rdquo;.
          </p>
        }
        stats={[
          { label: "Chapters", value: c.chapters.length },
          { label: "Notes", value: c.notes.length },
          { label: "Starred", value: c.notes.filter((n) => n.starred).length, tone: "gold" },
          { label: "Hidden", value: c.notes.filter((n) => n.hidden).length, tone: "muted" },
        ]}
      />
      <Chronicle
        view={c}
        gameName={view.state.name}
        send={async (cmd) => (await call(cmd as never)).error}
        chapterExtra={(ch) => {
          const sess = view.state.sessions.find((x) => x.id === ch.id);
          return sess && sess.endedAt !== null ? <LastTimeChapter session={sess} /> : null;
        }}
        noteExtra={(n) =>
          n.tags.includes("keepsake") || n.hidden ? null : (
            <div className="ks-note">
              <GiveKeepsake
                playerIds={view.state.players.some((p) => p.id === n.authorId && !p.archived) ? [n.authorId] : []}
                line={n.text.slice(0, 240)}
                sessionId={view.state.sessions.some((x) => x.id === n.chapterId) ? n.chapterId : undefined}
                label="Give a keepsake for this"
              />
            </div>
          )
        }
      />
    </div>
  );
}
