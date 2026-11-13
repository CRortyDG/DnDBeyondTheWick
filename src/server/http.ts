import "server-only";
import { NextResponse } from "next/server";
import { normaliseGameId } from "@/shared/handles";
import { KEY_HEADER } from "./auth";
import { HttpError } from "./game";

export function params(req: Request) {
  const url = new URL(req.url);
  return {
    game: normaliseGameId(url.searchParams.get("game")),
    player: url.searchParams.get("player"),
    key: req.headers.get(KEY_HEADER),
  };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, code: e.code }, e.status);
    console.error(e);
    return json({ error: "Something went wrong on the server." }, 500);
  }
}
