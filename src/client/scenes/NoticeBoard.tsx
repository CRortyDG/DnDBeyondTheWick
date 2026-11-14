// The Candlefair notice board: cork in a wooden frame, rendered inside a fixed-size
// stage that scales to the screen. Every note on it is data the DM places (see Board.tsx).
import type { ReactNode } from "react";
import { Pinned, type BoardView } from "./Board";

/** The frame and cork, 1920x1080. children: drawn on the cork instead of the pinned notes (the DM's editor). */
export function NoticeBoard({ board, children }: { board?: BoardView; children?: ReactNode }) {
  return (
    <div className="board-frame">
      <div className="board-cork">{children ?? <Pinned board={board} />}</div>
    </div>
  );
}
