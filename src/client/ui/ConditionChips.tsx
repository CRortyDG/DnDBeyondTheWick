"use client";

// Condition chips that explain themselves: tap "Grappled" to read what it does.

import { useState } from "react";
import type { PublicCondition } from "@/shared/combat";
import { conditionRule } from "@/shared/conditionRules";

export function ConditionChips({ list, label }: { list: PublicCondition[]; label: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!list.length) return null;
  const rule = open ? conditionRule(open) : undefined;
  return (
    <div className="cond-chips">
      <div className="fc-conds" aria-label={label}>
        {list.map((k, i) => {
          const text = `${k.name}${k.level ? ` ${k.level}` : ""}${k.rounds !== undefined ? ` · ${k.rounds} rd${k.rounds === 1 ? "" : "s"}` : ""}`;
          return conditionRule(k.name) ? (
            <button key={i} type="button" className={`beat-action-chip cond-chip${open === k.name ? " on" : ""}`} aria-expanded={open === k.name} onClick={() => setOpen((o) => (o === k.name ? null : k.name))}>
              {text} <span className="cond-chip-i" aria-hidden="true">?</span>
            </button>
          ) : (
            <span key={i} className="beat-action-chip">
              {text}
            </span>
          );
        })}
      </div>
      {open && rule ? (
        <p className="cond-rule" role="status">
          <b>{open}:</b> {rule}
        </p>
      ) : null}
    </div>
  );
}
