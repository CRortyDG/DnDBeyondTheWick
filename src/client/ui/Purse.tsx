"use client";

import { useEffect, useRef, useState } from "react";
import { formatCp, formatDelta } from "@/shared/money";
import type { PublicPlayer } from "@/shared/projection";

interface Float {
  key: number;
  playerId: string;
  delta: number;
}

/**
 * The party purse. When a balance changes between two views, a "+25 gp" /
 * "−1 gp" floats up beside the name. Floats come from the balances themselves,
 * so they still appear after a reconnect.
 */
export function Purse({ players, visible, size = "tv" }: { players: PublicPlayer[]; visible: boolean; size?: "tv" | "small" }) {
  const prev = useRef<Map<string, number> | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const seq = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const now = new Map(players.map((p) => [p.id, p.balanceCp]));
    const before = prev.current;
    prev.current = now;
    if (!before) return;
    const fresh: Float[] = [];
    for (const [id, cp] of now) {
      const old = before.get(id);
      if (old !== undefined && old !== cp) fresh.push({ key: ++seq.current, playerId: id, delta: cp - old });
    }
    if (!fresh.length) return;
    setFloats((f) => [...f, ...fresh]);
    const keys = new Set(fresh.map((f) => f.key));
    timers.current.push(setTimeout(() => setFloats((f) => f.filter((x) => !keys.has(x.key))), 2600));
  }, [players]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const total = players.reduce((a, p) => a + p.balanceCp, 0);

  return (
    <aside className={`purse purse-${size}${players.length > 6 ? " purse-many" : ""}${visible ? "" : " purse-off"}`} aria-label="Party purse" aria-hidden={!visible}>
      <h2>Party Purse</h2>
      {players.length === 0 ? <div className="purse-empty">Nobody at the table yet</div> : null}
      {players.map((p) => (
        <div className="purse-row" key={p.id}>
          <span className="purse-name">{p.name}</span>
          <span className="purse-amt">{formatCp(p.balanceCp)}</span>
          {floats
            .filter((f) => f.playerId === p.id)
            .map((f) => (
              <span key={f.key} className={`float ${f.delta > 0 ? "up" : "down"}`} aria-hidden="true">
                {formatDelta(f.delta)}
              </span>
            ))}
        </div>
      ))}
      <div className="purse-total">Party total: {formatCp(total)}</div>
    </aside>
  );
}
