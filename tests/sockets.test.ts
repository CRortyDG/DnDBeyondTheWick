import { describe, expect, it } from "vitest";
import { admit, GUEST_SOCKETS, MAX_SOCKETS, PER_ADDRESS_SOCKETS, SIGN_IN_MS, type SocketInfo } from "@/server/sockets";

const now = 1_000_000;
const many = (n: number, s: (i: number) => SocketInfo) => Array.from({ length: n }, (_, i) => s(i));

describe("who gets a live connection in a busy room", () => {
  it("lets a screen in when there's room", () => {
    expect(admit([], "1.1.1.1", now)).toEqual({ ok: true, close: [] });
  });

  it("closes connections that never sent their key", () => {
    const open: SocketInfo[] = [
      { kind: "pending", at: now - SIGN_IN_MS - 1, ip: "9.9.9.9" },
      { kind: "pending", at: now - 1000, ip: "9.9.9.9" },
      { kind: "member", at: now - 3_600_000, ip: "2.2.2.2" },
    ];
    expect(admit(open, "1.1.1.1", now)).toEqual({ ok: true, close: [0] });
  });

  it("doesn't let idle connections from many addresses lock the DM out", () => {
    // The attack from the Nov 23 test: 100 connections that never sign in.
    const open = many(MAX_SOCKETS, (i) => ({ kind: "pending", at: now - 5000 + i, ip: `10.0.0.${i}` }));
    const r = admit(open, "1.1.1.1", now);
    expect(r.ok).toBe(true);
    expect(MAX_SOCKETS - r.close.length).toBeLessThan(GUEST_SOCKETS);
  });

  it("keeps guests (TV, wrong keys) to their share, oldest first", () => {
    const open = many(GUEST_SOCKETS, (i) => ({ kind: "guest", at: now - 100_000 + i, ip: `10.0.0.${i}` }));
    expect(admit(open, "1.1.1.1", now)).toEqual({ ok: true, close: [0] });
  });

  it("never closes a signed-in screen to make room; a room full of them says so", () => {
    const open = many(MAX_SOCKETS, (i) => ({ kind: "member", at: now - i, ip: `10.0.${Math.floor(i / 10)}.${i}` }));
    const r = admit(open, "1.1.1.1", now);
    expect(r.ok).toBe(false);
    expect(r.close).toEqual([]);
  });

  it("makes room in a full room by closing the oldest guest", () => {
    const open: SocketInfo[] = [
      ...many(MAX_SOCKETS - 2, (i) => ({ kind: "member", at: now - i, ip: `10.0.${Math.floor(i / 10)}.${i}` })),
      { kind: "guest", at: now - 50, ip: "8.8.8.8" },
      { kind: "guest", at: now - 90, ip: "8.8.4.4" },
    ];
    expect(admit(open, "1.1.1.1", now)).toEqual({ ok: true, close: [MAX_SOCKETS - 1] });
  });

  it("makes an address's own oldest guest give way when it's at its cap", () => {
    const open: SocketInfo[] = [...many(PER_ADDRESS_SOCKETS - 1, (i) => ({ kind: "member", at: now - i, ip: "3.3.3.3" })), { kind: "pending", at: now - 10, ip: "3.3.3.3" }];
    expect(admit(open, "3.3.3.3", now)).toEqual({ ok: true, close: [PER_ADDRESS_SOCKETS - 1] });
  });

  it("caps one address's signed-in connections to one room", () => {
    const open = many(PER_ADDRESS_SOCKETS, (i) => ({ kind: "member", at: now - i, ip: "3.3.3.3" }));
    expect(admit(open, "3.3.3.3", now).ok).toBe(false);
    expect(admit(open, "4.4.4.4", now).ok).toBe(true);
  });

  it("treats connections from before this change (no time) as oldest", () => {
    const open: SocketInfo[] = [...many(GUEST_SOCKETS - 1, (i) => ({ kind: "guest", at: now - i, ip: `10.0.0.${i}` })), { kind: "guest" }];
    expect(admit(open, "1.1.1.1", now)).toEqual({ ok: true, close: [GUEST_SOCKETS - 1] });
  });
});
