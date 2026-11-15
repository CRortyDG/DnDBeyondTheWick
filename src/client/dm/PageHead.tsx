"use client";

import { useState, type ReactNode } from "react";
import { InfoIcon } from "./navIcons";

export type Stat = { label: string; value: ReactNode; tone?: "gold" | "ok" | "warn" | "muted" };

/**
 * The top of every DM page: title, one line on what the page is for, the page's main buttons on the right,
 * the longer how-it-works text behind an info button, and an optional row of figures.
 */
export function PageHead({ title, sub, help, actions, stats }: { title: string; sub?: ReactNode; help?: ReactNode; actions?: ReactNode; stats?: Stat[] }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="pg-head">
      <div className="pg-head-row">
        <div className="pg-head-text">
          <h1>
            {title}
            {help ? (
              <button type="button" className={`pg-help-btn${open ? " on" : ""}`} aria-expanded={open} aria-label={`How ${title} works`} title="How this page works" onClick={() => setOpen((o) => !o)}>
                <InfoIcon size={16} />
              </button>
            ) : null}
          </h1>
          {sub ? <p className="pg-sub">{sub}</p> : null}
        </div>
        {actions ? <div className="pg-actions">{actions}</div> : null}
      </div>
      {help && open ? <div className="pg-help">{help}</div> : null}
      {stats?.length ? (
        <dl className="pg-stats">
          {stats.map((s) => (
            <div key={s.label} className={s.tone ? `tone-${s.tone}` : undefined}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
