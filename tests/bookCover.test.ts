// Out of the book: the DM's cover line reaches every phone, and only the DM can set it.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { playerCommand } from "@/shared/commands";
import { projectPlayer, projectTv } from "@/shared/projection";
import { apply, CommandError } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import { hydrate } from "@/server/store";
import type { Actor, GameState } from "@/shared/types";

const DM: Actor = { role: "dm" };
const P1: Actor = { role: "player", playerId: "p1" };
let g: GameState;
let now = 1_000_000;
const run = (actor: Actor, cmd: Command) => (g = apply(g, cmd, { now: (now += 1000), actor }).state);

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
});

describe("the book's cover line", () => {
  it("is missing until the DM sets it", () => {
    expect(projectPlayer(g, 1, "p1", []).game.bookLine).toBeUndefined();
  });

  it("is tidied, shown on phones and the TV, and cleared when blank", () => {
    run(DM, { type: "game.bookLine", line: "  Being told   by the Wizard " });
    expect(g.bookLine).toBe("Being told by the Wizard");
    expect(projectPlayer(g, 1, "p1", []).game.bookLine).toBe("Being told by the Wizard");
    expect(projectTv(g, 1).game.bookLine).toBe("Being told by the Wizard");
    run(DM, { type: "game.bookLine", line: "   " });
    expect(g.bookLine).toBeUndefined();
    expect(projectPlayer(g, 1, "p1", []).game).not.toHaveProperty("bookLine");
  });

  it("isn't something a player can send", () => {
    expect(playerCommand.safeParse({ type: "game.bookLine", line: "Mine now" }).success).toBe(false);
    expect(() => apply(g, { type: "game.bookLine", line: "Mine now" }, { now, actor: P1 })).toThrow(CommandError);
  });
});
