import { describe, expect, it } from "vitest";
import { screenKey } from "@/server/limits";

const key = (q: string, path = "/api/command") => screenKey("1.2.3.4", new URL(`https://x${path}?${q}`));

describe("per-screen request allowance", () => {
  it("gives the DM, the TV and each phone on one address their own allowance", () => {
    const keys = new Set([key("game=abc&player=DM"), key("game=abc&player=TV"), key("game=abc&player=Sam"), key("game=abc", "/api/arrival")]);
    expect(keys.size).toBe(4);
  });
  it("counts one screen the same whatever the call or casing", () => {
    expect(key("game=ABC&player=Sam", "/api/view")).toBe(key("game=abc&player=sam", "/api/command"));
  });
  it("keeps addresses apart", () => {
    expect(screenKey("5.6.7.8", new URL("https://x/api/view?game=abc&player=DM"))).not.toBe(key("game=abc&player=DM"));
  });
});
