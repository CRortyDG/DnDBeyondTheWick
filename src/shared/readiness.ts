// "Ready for tonight?": things worth a look before a session starts. Nothing
// here stops a session; it's the list a DM would otherwise run through by eye.

import { resolveRef, type AssetGame } from "./assets";
import { findRef } from "./discovery";
import type { GameState } from "./types";
import { emptyHandout } from "./handout";

export interface ReadyItem {
  /** "fix": likely to show up wrong at the table. "check": worth a glance. */
  level: "fix" | "check";
  text: string;
  /** The DM page that sorts it. */
  page: "scenes" | "episodes" | "players" | "arrival" | "game";
}

const NEEDS_PICTURE = new Set(["map", "image", "portrait"]);

export function readiness(g: GameState): ReadyItem[] {
  const out: ReadyItem[] = [];
  // Scenes with nothing to show.
  const blank = g.scenes.filter((sc) => NEEDS_PICTURE.has(sc.kind) && !sc.art?.url && !sc.art?.builtin);
  for (const sc of blank) out.push({ level: "fix", text: `${sc.label || sc.name || "A scene"} has no picture, so the TV shows an empty board.`, page: "scenes" });
  // Handouts can be words instead of a picture; one with neither is a blank sheet.
  for (const sc of g.scenes.filter(emptyHandout)) out.push({ level: "fix", text: `${sc.label || "A handout"} has no words or picture, so the TV shows a blank sheet.`, page: "scenes" });

  // The episode that's likely next: beats that point at things that aren't there.
  const ids = new Set(g.scenes.map((x) => x.id));
  const monsters = new Set((g.monsters ?? []).map((m) => m.name.trim().toLowerCase()));
  for (const ep of g.episodes ?? []) {
    ep.beats.forEach((b, i) => {
      for (const a of b.actions ?? []) {
        const where = `${ep.title}, beat ${i + 1} (${b.title})`;
        if (a.type === "scene" && !ids.has(a.sceneId)) out.push({ level: "fix", text: `${where} shows a scene that was deleted.`, page: "episodes" });
        if (a.type === "show" && !resolveRef(g as AssetGame, a.ref)) out.push({ level: "fix", text: `${where} shows “${a.ref}”, which doesn't exist.`, page: "episodes" });
        if ((a.type === "reveal" || a.type === "fact") && !findRef(g, a.ref)) out.push({ level: "fix", text: `${where} reveals “${a.ref}”, which doesn't exist.`, page: "episodes" });
        if (a.type === "fight") {
          for (const m of a.monsters) if (!monsters.has(m.name.trim().toLowerCase())) out.push({ level: "fix", text: `${where} starts a fight with “${m.name}”, which isn't under Monsters.`, page: "episodes" });
        }
      }
    });
  }

  // Players.
  const seated = g.players.filter((p) => !p.archived);
  const linked = seated.filter((p) => p.arrival?.token);
  if (linked.length) {
    const unclaimed = seated.filter((p) => !p.arrival?.claimedAt).map((p) => p.name);
    if (unclaimed.length) out.push({ level: "check", text: `No seat claimed yet: ${unclaimed.join(", ")}.`, page: "arrival" });
  }
  // The DM's copy of the game says hasKey instead of the key's hash.
  const open = seated.filter((p) => !p.keyHash && !(p as { hasKey?: boolean }).hasKey).map((p) => p.name);
  if (open.length) out.push({ level: "check", text: `Not locked to a phone yet: ${open.join(", ")}. Anyone with the code could open their page. Their Arrival link locks it.`, page: "players" });
  if (!g.doorClosed) out.push({ level: "check", text: "The door is open: anyone with the campaign code can join as a new player.", page: "players" });

  // Leftovers from last time.
  if (g.fight) out.push({ level: "fix", text: "A fight from before is still open.", page: "game" });
  const waiting = g.requests.filter((r) => r.status === "pending").length;
  if (waiting) out.push({ level: "check", text: `${waiting} ${waiting === 1 ? "ask is" : "asks are"} still waiting in Requests.`, page: "game" });
  return out;
}
