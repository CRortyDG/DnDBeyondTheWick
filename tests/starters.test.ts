// Starting points for first-time players on the Arrival seat page.
import { beforeEach, describe, expect, it } from "vitest";
import { handleApi } from "@/server/api";
import { execute } from "@/server/game";
import { createMemoryStore, type MemoryStore } from "@/server/store";
import { projectPlayer, projectTv } from "@/shared/projection";
import { seedGame } from "@/shared/seed";
import { QUIZ, quizPick, STARTERS, STARTER_IDS } from "@/shared/starters";
import type { GameState } from "@/shared/types";

const DM = { role: "dm" as const };
const G = "candlefair";
let store: MemoryStore;

beforeEach(async () => {
  store = createMemoryStore();
  await store.overwrite(G, seedGame(G), []);
  await execute(store, G, DM, { type: "arrival.issueLinks" });
});

async function state(): Promise<GameState> {
  return (await store.read(G)).state!;
}
async function claim(playerId: string, body: object) {
  const t = (await state()).players.find((p) => p.id === playerId)!.arrival!.token;
  const res = await handleApi(new Request(`http://x/api/arrival?game=${G}&t=${t}`, { method: "POST", body: JSON.stringify({ type: "claim", ...body }), headers: { "content-type": "application/json" } }), store);
  return { status: res.status, body: (await res.json()) as { me?: { pick: string } } };
}

describe("starting points", () => {
  it("has six, each with a full 2024 D&D Beyond recipe", () => {
    expect(STARTERS.map((s) => s.id)).toEqual([...STARTER_IDS]);
    for (const s of STARTERS) {
      expect(s.dnd.cls && s.dnd.species && s.dnd.background && s.best).toBeTruthy();
      expect(s.sampleName.length).toBeLessThanOrEqual(40);
      expect(s.sampleWhy.length).toBeLessThanOrEqual(120);
    }
  });

  it("every set of quiz answers suggests a real starting point", () => {
    const all = new Set<string>();
    for (let n = 0; n < 2 ** QUIZ.length; n++) {
      const answers = QUIZ.map((_, i) => (n >> i) & 1);
      const id = quizPick(answers);
      expect(STARTER_IDS).toContain(id);
      all.add(id);
    }
    expect(all.size).toBe(6);
  });

  it("a claim saves the pick, the phone gets it back, and the DM sees it", async () => {
    const r = await claim("p1", { character: "Dagna", why: "", pick: "healer" });
    expect(r.status).toBe(200);
    expect(r.body.me?.pick).toBe("healer");
    expect((await state()).players.find((p) => p.id === "p1")!.arrival!.pick).toBe("healer");
  });

  it("a claim without a pick keeps the old one; null clears it", async () => {
    await claim("p1", { character: "Dagna", why: "", pick: "healer" });
    await claim("p1", { character: "Dagna Stout", why: "" });
    expect((await state()).players.find((p) => p.id === "p1")!.arrival!.pick).toBe("healer");
    await claim("p1", { character: "Dagna Stout", why: "", pick: null });
    expect((await state()).players.find((p) => p.id === "p1")!.arrival!.pick).toBeUndefined();
  });

  it("refuses a made-up pick", async () => {
    const r = await claim("p1", { character: "X", why: "", pick: "dragon" });
    expect(r.status).toBe(400);
  });

  it("the DM's reset clears it, and it never reaches other players or the TV", async () => {
    await claim("p1", { character: "Dagna", why: "", pick: "healer" });
    const s = await state();
    expect(JSON.stringify(projectTv(s, 1))).not.toContain("healer");
    expect(JSON.stringify(projectPlayer(s, 1, "p2", []))).not.toContain("healer");
    await execute(store, G, DM, { type: "arrival.reset", playerId: "p1" });
    expect((await state()).players.find((p) => p.id === "p1")!.arrival!.pick).toBeUndefined();
  });
});
