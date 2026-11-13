import { describe, expect, it } from "vitest";
import { canAfford, formatCp, formatDelta, parseAmount } from "@/shared/money";

describe("formatCp", () => {
  it("formats copper as gp sp cp", () => {
    expect(formatCp(1253)).toBe("12 gp 5 sp 3 cp");
    expect(formatCp(2500)).toBe("25 gp");
    expect(formatCp(30)).toBe("3 sp");
    expect(formatCp(4)).toBe("4 cp");
    expect(formatCp(0)).toBe("0 gp");
    expect(formatCp(150000)).toBe("1,500 gp");
  });
  it("uses a real minus sign for negatives", () => {
    expect(formatCp(-100)).toBe("−1 gp");
    expect(formatDelta(-100)).toBe("−1 gp");
    expect(formatDelta(2500)).toBe("+25 gp");
  });
});

describe("parseAmount", () => {
  it("treats a bare number as gold", () => {
    expect(parseAmount("25")).toBe(2500);
    expect(parseAmount("2.5")).toBe(250);
    expect(parseAmount("0.01")).toBe(1);
    expect(parseAmount("1,500")).toBe(150000);
  });
  it("reads coin units", () => {
    expect(parseAmount("12 gp 5 sp 3 cp")).toBe(1253);
    expect(parseAmount("3sp 4cp")).toBe(34);
    expect(parseAmount("1 pp")).toBe(1000);
    expect(parseAmount("2 ep")).toBe(100);
    expect(parseAmount("5g 2s")).toBe(520);
  });
  it("rejects nonsense and negatives", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("5 gp and a goat")).toBeNull();
  });
  it("never produces fractional copper", () => {
    for (const s of ["0.333", "1.005", "2.5 sp", "0.1 cp"]) {
      const v = parseAmount(s)!;
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("canAfford", () => {
  it("allows spending exactly what you have", () => {
    expect(canAfford(100, 100)).toBe(true);
    expect(canAfford(99, 100)).toBe(false);
    expect(canAfford(0, 0)).toBe(true);
  });
});
