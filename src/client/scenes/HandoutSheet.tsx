// A handout's words on paper, drawn with the notice board's papers and type,
// straightened and as big as fits the TV (like a note seen up close).
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { blocks, type HandoutSheet, type Span } from "@/shared/handout";

function Spans({ list }: { list: Span[] }) {
  return (
    <>
      {list.map((s, i) => {
        let n: ReactNode = s.text;
        if (s.i) n = <em>{n}</em>;
        if (s.b) n = <strong>{n}</strong>;
        return <span key={i}>{n}</span>;
      })}
    </>
  );
}

/** The paper itself, at its own size (560 board pixels wide). */
export function HandoutPaper({ sheet, image, alt }: { sheet: HandoutSheet; image?: string | null; alt?: string }) {
  const ink = sheet.ink ? ` ink-${sheet.ink}` : "";
  const body = blocks(sheet.body);
  return (
    <div className={`note-card paper-${sheet.paper} font-${sheet.font} pin-none handout-sheet`} role="figure" aria-label={sheet.title || alt || "A handout"}>
      <div className="note-inner">
        {image ? <img className="note-img handout-img" src={image} alt={alt ?? ""} draggable={false} /> : null}
        {sheet.title ? <div className={`note-title${ink}`}>{sheet.title}</div> : null}
        {body.length ? (
          <div className="handout-body">
            {body.map((b, i) =>
              b.kind === "sign" ? (
                <p key={i} className="handout-signline">
                  <Spans list={b.spans} />
                </p>
              ) : (
                <p key={i}>
                  {b.lines.map((l, j) => (
                    <span key={j}>
                      {j ? <br /> : null}
                      <Spans list={l} />
                    </span>
                  ))}
                </p>
              ),
            )}
          </div>
        ) : null}
        {sheet.sign ? <div className="note-sign handout-sign">{sheet.sign}</div> : null}
      </div>
    </div>
  );
}

/** Fills a 1920 x 1080 stage: the paper, scaled to fit. */
export function HandoutOnStage({ sheet, image, alt }: { sheet: HandoutSheet; image?: string | null; alt?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const fit = () => setScale(Math.min(2.4, 1700 / el.offsetWidth, 980 / Math.max(1, el.offsetHeight)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="handout">
      <div ref={inner} className="handout-fit" style={{ transform: `scale(${scale}) rotate(-1deg)`, visibility: scale ? "visible" : "hidden" }}>
        <HandoutPaper sheet={sheet} image={image} alt={alt} />
      </div>
    </div>
  );
}
