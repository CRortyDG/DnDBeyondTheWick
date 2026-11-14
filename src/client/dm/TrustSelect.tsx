"use client";

import { entriesOf } from "@/shared/discovery";
import type { TrustNeed } from "@/shared/types";
import { useDm } from "./context";

/** "Needs someone's goodwill": a person in the compendium, Friendly or Ally. Uses how they feel about the whole party. */
export function TrustSelect({ value, onChange, label = "Needs someone’s goodwill" }: { value: TrustNeed | null | undefined; onChange: (v: TrustNeed | null) => void; label?: string }) {
  const { view } = useDm();
  const people = entriesOf(view.state).filter((e) => e.kind === "person");
  return (
    <label>
      {label}
      <select
        className="fld"
        value={value ? `${value.entryId}|${value.relation}` : ""}
        onChange={(e) => {
          const [entryId, relation] = e.target.value.split("|");
          onChange(entryId ? { entryId, relation: relation as TrustNeed["relation"] } : null);
        }}
      >
        <option value="">Nobody&rsquo;s</option>
        {people.flatMap((p) => [
          <option key={`${p.id}f`} value={`${p.id}|friendly`}>
            {p.name}: friendly
          </option>,
          <option key={`${p.id}a`} value={`${p.id}|ally`}>
            {p.name}: ally
          </option>,
        ])}
      </select>
    </label>
  );
}
