"use client";

// "Fight it" on a monster's Discover entry. DM-only: players never start a fight.
// It sets up a fight with the entry's stat block (from the Monsters tab), or adds
// them to the fight that's already going. Winning a fight with its name revealed
// makes the monster Known in Discover; see noteMonsters in the reducer.

import { useState } from "react";
import { monstersOf } from "@/shared/combat";
import { hereOf } from "@/shared/offscript";
import type { Entry, GameState, MonsterTemplate } from "@/shared/types";
import { useDm } from "./context";
import { MenuItem } from "./RowMenu";
import { SwordIcon } from "./navIcons";

/** The entry's stat block: the one it's tied to, or one with the same name. */
export function entryTemplate(s: GameState, e: Entry): { template: MonsterTemplate; linked: boolean } | undefined {
  if (e.kind !== "monster") return undefined;
  const list = monstersOf(s);
  const tied = e.templateId ? list.find((t) => t.id === e.templateId) : undefined;
  if (tied) return { template: tied, linked: true };
  const key = e.name.trim().toLowerCase();
  const same = key ? list.find((t) => t.name.trim().toLowerCase() === key) : undefined;
  return same ? { template: same, linked: false } : undefined;
}

function useFightIt(e: Entry) {
  const { view, run } = useDm();
  const s = view.state;
  const found = entryTemplate(s, e);
  const f = s.fight;
  const why = !found
    ? "Pick its stat block from the Monsters tab first"
    : f?.status === "over"
      ? "Close the last fight first"
      : undefined;
  const go = async (count: number) => {
    if (!found) return false;
    const n = Math.max(1, Math.min(20, Math.round(count) || 1));
    const { template: t, linked } = found;
    // Matched by name: tie them so the fight's result lands on this entry.
    if (!linked && !(await run({ type: "entry.update", entryId: e.id, patch: { templateId: t.id } }))) return false;
    if (f) return run({ type: "fight.add", templateId: t.id, count: n }, n === 1 ? `${t.name} joins the fight.` : `${n} × ${t.name} join the fight.`);
    const where = hereOf(s)?.name ?? "";
    return run({ type: "fight.start", groups: [{ templateId: t.id, count: n }], ...(where ? { where } : {}) }, "Roll initiative! The TV and phones are asking.");
  };
  return { found, joining: !!f && f.status !== "over", why, go };
}

/** The row menu's quick one: a single monster. */
export function FightItMenuItem({ entry: e }: { entry: Entry }) {
  const { joining, why, go } = useFightIt(e);
  return (
    <MenuItem disabled={!!why} title={why ?? (joining ? "Add one to the fight that's going" : "Set up a fight with one of these")} onClick={() => void go(1)}>
      {joining ? "Add to the fight" : "Fight it"}
    </MenuItem>
  );
}

/** In the entry's editor: how many, then Fight. */
export function FightItBar({ entry: e }: { entry: Entry }) {
  const { found, joining, why, go } = useFightIt(e);
  const [count, setCount] = useState("1");
  return (
    <div className="inline fight-it">
      <label>
        How many
        <input className="fld" type="number" min={1} max={20} value={count} onChange={(ev) => setCount(ev.target.value)} style={{ width: "5em" }} />
      </label>
      <button className="btn" type="button" disabled={!!why} title={why} onClick={() => void go(Number(count))}>
        <SwordIcon size={16} /> {joining ? "Add to the fight" : "Fight it"}
      </button>
      <span className="note">
        {found
          ? `Uses the ${found.template.name} stat block. Only you can start a fight. Win one with its name revealed and it becomes Known here.`
          : "Pick its stat block above (or add one in the Monsters tab) to fight it from here."}
      </span>
    </div>
  );
}
