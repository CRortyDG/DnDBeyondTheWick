"use client";

// Condition chips that explain themselves: tap "Grappled" to read what it does.
// rules: every rule shows at once (on your turn). onRemove: each chip gets a ×.

import { useState } from "react";
import type { PublicCondition } from "@/shared/combat";
import { conditionGlyph, conditionRule } from "@/shared/conditionRules";

export function ConditionChips({ list, label, rules = false, onRemove }: { list: PublicCondition[]; label: string; rules?: boolean; onRemove?: (k: PublicCondition) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!list.length) return null;
  const rule = open ? conditionRule(open) : undefined;
  const all = rules ? list.filter((k) => conditionRule(k.name)) : [];
  return (
    <div className="cond-chips">
      <div className="fc-conds" aria-label={label}>
        {list.map((k, i) => {
          const text = `${k.name}${k.level ? ` ${k.level}` : ""}${k.rounds !== undefined ? ` · ${k.rounds} rd${k.rounds === 1 ? "" : "s"}` : ""}`;
          const chip =
            conditionRule(k.name) && !rules ? (
              <button type="button" className={`beat-action-chip cond-chip${open === k.name ? " on" : ""}`} aria-expanded={open === k.name} onClick={() => setOpen((o) => (o === k.name ? null : k.name))}>
                <span className="cond-chip-g" aria-hidden="true">
                  {conditionGlyph(k.name)}
                </span>
                {text} <span className="cond-chip-i" aria-hidden="true">?</span>
              </button>
            ) : (
              <span className="beat-action-chip">
                <span className="cond-chip-g" aria-hidden="true">
                  {conditionGlyph(k.name)}
                </span>
                {text}
              </span>
            );
          return onRemove && k.id ? (
            <span key={k.id ?? i} className="cond-chip-wrap">
              {chip}
              <button type="button" className="cond-chip-x" aria-label={`Remove ${k.name}`} onClick={() => onRemove(k)}>
                ×
              </button>
            </span>
          ) : (
            <span key={k.id ?? i} className="cond-chip-wrap">
              {chip}
            </span>
          );
        })}
      </div>
      {rules && all.length ? (
        <ul className="cond-rules" aria-label="What they do">
          {all.map((k, i) => (
            <li key={k.id ?? i}>
              <b>{k.name}:</b> {conditionRule(k.name)}
            </li>
          ))}
        </ul>
      ) : open && rule ? (
        <p className="cond-rule" role="status">
          <b>{open}:</b> {rule}
        </p>
      ) : null}
    </div>
  );
}
