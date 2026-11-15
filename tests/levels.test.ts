// Level up the party: levels per character, the TV moment, the Chronicle line, phones.
import { describe, expect, it } from "vitest";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, type Ctx } from "@/shared/reducer";
import { levelLine, suggestedLevels } from "@/shared/levels";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import { dmCommand, playerCommand, type Command } from "@/shared/commands";
import type { GameState } from "@/shared/types";

const DM: Ctx = { now: 1000, actor: { role: "dm" } };
const run = (g: GameState, cmd: Command) => apply(g, cmd, { ...DM, rand: () => 0.5 }).state;

function table(): GameState {
  const g = hydrate(seedGame("t"))!;
  g.players[2].away = true;
  g.players[3].away = true;
  g.players[0].character = "Brin";
  g.players[1].character = "Ash";
  return g;
}

describe("level up", () => {
  it("suggests one more for everyone at the table", () => {
    const g = table();
    g.players[0].level = 2;
    expect(suggestedLevels(g)).toEqual([
      { playerId: "p1", from: 2, level: 3 },
      { playerId: "p2", from: null, level: 2 },
    ]);
  });

  it("sets levels, plays the TV moment, writes the Chronicle and tells each phone", () => {
    let g = table();
    const notes = (g.notes ?? []).length;
    g = run(g, { type: "party.levelUp", levels: [{ playerId: "p1", level: 3 }, { playerId: "p2", level: 3 }] });
    expect(g.players[0].level).toBe(3);
    expect(g.notes!.length).toBe(notes + 1);
    expect(g.notes!.at(-1)!.text).toBe("The party reached level 3.");
    const tv = projectTv(g, 1);
    expect(tv.levelMoment).toMatchObject({ level: 3, who: [{ name: "Brin", level: 3 }, { name: "Ash", level: 3 }] });
    const ph = projectPlayer(g, 1, "p1", []);
    expect(ph.me.level).toBe(3);
    expect(ph.levelUp).toEqual({ n: tv.levelMoment!.n, level: 3 });
    expect(projectPlayer(g, 1, "p3", []).levelUp).toBeUndefined();
  });

  it("handles different levels and a quiet level up", () => {
    let g = table();
    g = run(g, { type: "party.levelUp", levels: [{ playerId: "p1", level: 4 }, { playerId: "p2", level: 3 }], tv: false });
    expect(g.levelMoment).toBeUndefined();
    expect(g.notes!.at(-1)!.text).toBe("Brin reached level 4, Ash level 3.");
    g = run(g, { type: "party.levelUp", levels: [{ playerId: "p1", level: 5 }] });
    expect(projectTv(g, 1).levelMoment!.level).toBe(5);
    expect(levelLine(g, [{ playerId: "p1", level: 5 }])).toBe("Brin reached level 5.");
  });

  it("player.level sets or clears quietly; only the DM can level", () => {
    let g = table();
    g = run(g, { type: "player.level", playerId: "p2", level: 7 });
    expect(g.players[1].level).toBe(7);
    expect(g.levelMoment).toBeUndefined();
    g = run(g, { type: "player.level", playerId: "p2", level: null });
    expect(g.players[1].level).toBeUndefined();
    expect(playerCommand.safeParse({ type: "party.levelUp", levels: [{ playerId: "p1", level: 2 }] }).success).toBe(false);
    expect(dmCommand.safeParse({ type: "party.levelUp", levels: [{ playerId: "p1", level: 21 }] }).success).toBe(false);
  });
});
