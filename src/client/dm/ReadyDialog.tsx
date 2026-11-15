"use client";

import { readiness, type ReadyItem } from "@/shared/readiness";
import { nextSessionNumber } from "@/shared/reducer";
import { useDm } from "./context";

const PAGE_NAME: Record<ReadyItem["page"], string> = { scenes: "Maps & props", episodes: "Episodes", players: "Players", arrival: "Arrival", game: "Settings" };

/** Before "Start session": what's worth a look first. Starting anyway is always one click. */
export function ReadyDialog({ onClose, onGo }: { onClose: () => void; onGo: (page: ReadyItem["page"]) => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const items = readiness(s);
  const n = nextSessionNumber(s);
  const start = async () => {
    if (await run({ type: "session.start" }, "Session started. The TV is back on the notice board.")) onClose();
  };
  return (
    <div className="inbox-backdrop" onClick={onClose}>
      <aside className="inbox-drawer wrapup" role="dialog" aria-label="Ready for tonight?" onClick={(e) => e.stopPropagation()}>
        <div className="box-head">
          <h2>Ready for tonight?</h2>
          <button type="button" className="btn small" onClick={onClose}>
            Not yet
          </button>
        </div>
        {items.length ? (
          <ul className="ready-list">
            {items.map((x, i) => (
              <li key={i} className={`wrapup-step${x.level === "fix" ? " warn" : ""}`}>
                <span>{x.text}</span>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => {
                    onGo(x.page);
                    onClose();
                  }}
                >
                  {PAGE_NAME[x.page]}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">Everything looks ready.</p>
        )}
        <button type="button" className="btn primary" onClick={start}>
          Start session {n}
          {items.length ? " anyway" : ""}
        </button>
      </aside>
    </div>
  );
}
