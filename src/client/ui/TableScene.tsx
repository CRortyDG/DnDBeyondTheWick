"use client";

import { useEffect, useRef, useState } from "react";
import type { TableView } from "@/shared/arrival";
import { RoundTable } from "../arrival/RoundTable";
import { Stage } from "./Stage";

const QR_MS = 8000;

/**
 * "The Table" on the TV at session 0: one candle per player, lit as they
 * claim their seats. When the last one lights, every candle flares and the
 * title fades in, then it holds.
 */
export function TableScene({ table }: { table?: TableView }) {
  const seats = table?.seats ?? [];
  const all = seats.length > 0 && seats.every((s) => s.lit);

  // Flare each seat as it lights; flare them all for the finale.
  const prev = useRef<boolean[] | null>(null);
  const [flares, setFlares] = useState<number[]>([]);
  const [finale, setFinale] = useState(false);
  const lit = seats.map((s) => s.lit).join("");
  useEffect(() => {
    const now = seats.map((s) => s.lit);
    const before = prev.current;
    prev.current = now;
    if (!before) {
      setFinale(all); // already complete when the scene opened: just show it
      return;
    }
    const grewToAll = all && before.some((x) => !x);
    setFlares((f) => now.map((l, i) => (f[i] ?? 0) + ((l && !before[i]) || (grewToAll && l) ? 1 : 0)));
    setFinale(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lit]);

  return (
    <div className="scene-fill table-scene">
      <Stage w={1920} h={1080}>
        <div className="table-stage">
          <RoundTable seats={seats.map((s, i) => ({ ...s, flare: flares[i] ?? 0 }))} size="100%" wide={560} className="tv-table" />
          <div className={`table-title${finale ? " on" : ""}`} aria-hidden={!finale}>
            Tales from the Flickering Candle
          </div>
          {!all && table?.qr.length ? <QrCorner qr={table.qr} /> : null}
        </div>
      </Stage>
    </div>
  );
}

function QrCorner({ qr }: { qr: TableView["qr"] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (qr.length < 2) return;
    const t = setInterval(() => setI((n) => n + 1), QR_MS);
    return () => clearInterval(t);
  }, [qr.length]);
  const cur = qr[i % qr.length];
  const url = typeof window === "undefined" ? cur.path : window.location.origin + cur.path;
  return (
    <div className="table-qr">
      <QrCode text={url} />
      <div className="table-qr-label">
        <b>{cur.name}</b>
        <span>scan to take your seat</span>
      </div>
    </div>
  );
}

/** A QR code as SVG squares. The encoder is only loaded on the TV. */
function QrCode({ text }: { text: string }) {
  const [path, setPath] = useState<{ d: string; n: number } | null>(null);
  useEffect(() => {
    let live = true;
    void import("qrcode-generator").then(({ default: qrcode }) => {
      const q = qrcode(0, "M");
      q.addData(text);
      q.make();
      const n = q.getModuleCount();
      let d = "";
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
      if (live) setPath({ d, n });
    });
    return () => {
      live = false;
    };
  }, [text]);
  if (!path) return <div className="qr-box" />;
  return (
    <svg className="qr-box" viewBox={`-2 -2 ${path.n + 4} ${path.n + 4}`} shapeRendering="crispEdges" role="img" aria-label="QR code for this seat's link">
      <rect x="-2" y="-2" width={path.n + 4} height={path.n + 4} fill="#f6efe1" />
      <path d={path.d} fill="#140b05" />
    </svg>
  );
}
