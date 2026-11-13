import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { blobToken } from "@/server/blob";

describe("finding the Vercel Blob token", () => {
  it("uses the standard name", () => {
    expect(blobToken({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_abc" })).toBe("vercel_blob_rw_abc");
  });
  it("finds it under a custom prefix", () => {
    expect(blobToken({ CANDLEFAIR_READ_WRITE_TOKEN: "vercel_blob_rw_xyz", OTHER: "x" })).toBe("vercel_blob_rw_xyz");
  });
  it("ignores other read-write tokens and reports none when missing", () => {
    expect(blobToken({ KV_REST_API_READ_WRITE_TOKEN: "not-a-blob" })).toBeUndefined();
    expect(blobToken({})).toBeUndefined();
  });
});
