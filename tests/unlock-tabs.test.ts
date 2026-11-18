// "Unlock as they go": tabs that wait on phones until there's something in them.
import { beforeEach, describe, expect, it } from "vitest";
import type { Command } from "@/shared/commands";
import { projectPlayer } from "@/shared/projection";
import { apply, CommandError, type Ctx } from "@/shared/reducer";
import { seedGame } from "@/shared/seed";
import type { Actor, GameState } from "@/shared/types";
import { hydrate } from "@/server/store";

const DM: Actor = { role: "dm" };
let g: GameState;
let now = 1000;
function as(actor: Actor, cmd: Command) {
  const r = apply(g, cmd, { now: ++now, actor, token: () => `tok${++now}` } as Ctx);
  g = r.state;
  return r;
}
const dm = (cmd: Command) => as(DM, cmd);
const phone = (pid: string) => projectPlayer(g, 1, pid, []);
const hideAllShops = () => g.shops.forEach((sh) => dm({ type: "shop.visibility", shopId: sh.id, visibility: "hidden", quiet: true } as Command));

beforeEach(() => {
  g = hydrate(seedGame("t"))!;
  now = 1000;
});

describe("Gold waits for a shop", () => {
  it("is off unless the DM turns it on", () => {
    hideAllShops();
    expect(phone("p1").shops).toEqual([]);
    expect(phone("p1").goldLocked).toBeUndefined();
  });

  it("hides Gold until a shop opens to them", () => {
    dm({ type: "features.unlock", feature: "gold", on: true });
    expect(g.unlockAsFound).toEqual(["gold"]);
    hideAllShops();
    expect(phone("p1").goldLocked).toBe(true);
    dm({ type: "shop.visibility", shopId: g.shops[0].id, visibility: "all", quiet: true } as Command);
    expect(phone("p1").goldLocked).toBeUndefined();
    dm({ type: "features.unlock", feature: "gold", on: false });
    expect(g.unlockAsFound).toBeUndefined();
  });

  it("opens for just the player a shop is opened to", () => {
    dm({ type: "features.unlock", feature: "gold", on: true });
    hideAllShops();
    dm({ type: "shop.visibility", shopId: g.shops[0].id, visibility: "some", playerIds: ["p2"], quiet: true } as Command);
    expect(phone("p1").goldLocked).toBe(true);
    expect(phone("p2").goldLocked).toBeUndefined();
  });

  it("is DM-only", () => {
    expect(() => as({ role: "player", playerId: "p1" }, { type: "features.unlock", feature: "gold", on: true } as Command)).toThrow(CommandError);
  });
});
