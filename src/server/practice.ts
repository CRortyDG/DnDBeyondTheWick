import { z } from "zod";
import { isDmKey } from "./auth";
import { HttpError, MAX_STATE_CHARS } from "./game";
import { json, miss, params, snapshot } from "./api";
import type { Store } from "./store";
import { apply } from "@/shared/reducer";
import { addPrepNotes, applyPracticeEdits, practiceCopy, practiceEdits, practiceNoteLines, practiceTimes } from "@/shared/practice";
import type { GameState } from "@/shared/types";

/**
 * Practice mode, on the server.
 *
 * The practice copy is a second room (in production, a Durable Object named
 * "practice:<code>": a name no typed code or link can reach, since codes are
 * letters, digits and dashes). These routes run in the Worker with both rooms
 * at hand: start a copy, list its content edits, finish (copy the chosen
 * edits and the notes into the live game, then delete the copy). Only the DM
 * key gets in. The live game is never written except by Finish.
 */

const startBody = z.object({
  episodeId: z.string().min(1).max(64).optional(),
  fresh: z.boolean().optional(),
});
const endBody = z.object({
  keep: z.array(z.string().max(200)).max(500).optional(),
  notes: z.string().max(4000).optional(),
  discard: z.boolean().optional(),
});

export function isPracticeAdminPath(path: string): boolean {
  return path === "/api/practice" || path.startsWith("/api/practice/");
}

async function readBody(req: Request): Promise<unknown> {
  const text = await req.text().catch(() => "");
  if (text.length > 64 * 1024) throw new HttpError(413, "That request is too big.");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

async function practiceState(prac: Store, game: string) {
  const { state } = await prac.read(game);
  return state?.practice ? state : null;
}

/** /api/practice (status), /api/practice/start, /api/practice/edits, /api/practice/end. DM key only. */
export async function handlePracticeAdmin(req: Request, live: Store, prac: Store, now = Date.now()): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const { game, key } = params(req);
  try {
    const { state: liveState } = await live.read(game);
    if (!liveState) throw new HttpError(404, "No game here yet.", "no-game");
    const hash = await live.dmKeyHash(game);
    if (!isDmKey(key, hash)) throw new HttpError(401, "That DM key isn't right.", "bad-key");

    if (path === "/api/practice" && req.method === "GET") {
      const ps = await practiceState(prac, game);
      if (!ps?.practice) return json({ active: false });
      const ep = ps.practice.episodeId ? (ps.episodes ?? []).find((e) => e.id === ps.practice!.episodeId) : undefined;
      return json({
        active: true,
        startedAt: ps.practice.startedAt,
        ...(ep ? { episodeId: ep.id, episodeTitle: ep.title } : {}),
      });
    }

    if (path === "/api/practice/start" && req.method === "POST") {
      const r = startBody.safeParse(await readBody(req));
      if (!r.success) throw new HttpError(400, "That request didn't make sense.");
      const old = await practiceState(prac, game);
      // Already practising: carry on, unless asked to start over.
      if (old && !r.data.fresh) {
        if (hash) await prac.setDmKeyHash(game, hash);
        return json({ ok: true, resumed: true });
      }
      const episodeId = r.data.episodeId ?? (r.data.fresh ? old?.practice?.episodeId : undefined);
      if (episodeId && !(liveState.episodes ?? []).some((e) => e.id === episodeId)) throw new HttpError(404, "That episode doesn't exist.");
      let copy = practiceCopy(liveState, now, episodeId, old?.practice ? { notes: old.practice.notes, factor: old.practice.factor } : undefined);
      // "Practice this episode": its run sheet is up, ready to click through.
      if (episodeId) {
        try {
          copy = apply(copy, { type: "run.start", episodeId }, { now, actor: { role: "dm" } }).state;
        } catch {
          // A session already running another episode: practice starts as it is.
        }
      }
      if (!prac.beginPractice || !hash) throw new HttpError(503, "Practice isn't available here.");
      const v = await prac.beginPractice(game, copy, await live.ledger(game), hash, liveState);
      await prac.publish(game, v);
      return json({ ok: true });
    }

    if (path === "/api/practice/edits" && req.method === "GET") {
      const ps = await practiceState(prac, game);
      const base = ps && prac.practiceBase ? await prac.practiceBase(game) : null;
      if (!ps?.practice || !base) throw new HttpError(404, "There's no practice going.");
      return json({
        edits: practiceEdits(base, ps, liveState),
        times: practiceTimes(ps.practice, now),
        notes: ps.practice.notes,
        factor: ps.practice.factor,
        episodeId: ps.practice.episodeId ?? null,
      });
    }

    if (path === "/api/practice/end" && req.method === "POST") {
      const r = endBody.safeParse(await readBody(req));
      if (!r.success) throw new HttpError(400, "That request didn't make sense.");
      const ps = await practiceState(prac, game);
      const base = ps && prac.practiceBase ? await prac.practiceBase(game) : null;
      if (!ps?.practice || !base) {
        await prac.endPractice?.(game);
        return json({ ok: true, applied: 0, notes: 0 });
      }
      let applied = 0;
      let noted = 0;
      if (!r.data.discard) {
        const lines = practiceNoteLines(r.data.notes ?? ps.practice.notes);
        const keep = r.data.keep ?? [];
        if (keep.length || lines.length) {
          let saved = false;
          let snapped = false;
          for (let attempt = 0; attempt < 6 && !saved; attempt++) {
            const { state, version } = await live.read(game);
            if (!state) throw new HttpError(404, "No game here yet.", "no-game");
            const out = applyPracticeEdits(state, base, ps, keep);
            addPrepNotes(out.state, ps.practice.episodeId, lines, now);
            if (JSON.stringify(out.state).length > MAX_STATE_CHARS) throw new HttpError(413, "The campaign is too full to take these edits.", "too-big");
            if (!snapped && (snapped = true)) await snapshot(live, game, "Before keeping practice edits");
            const v = await live.commit(game, version, out.state as GameState, []);
            if (v !== null) {
              await live.publish(game, v);
              applied = out.applied;
              noted = lines.length;
              saved = true;
            } else await new Promise((res) => setTimeout(res, 20 + Math.random() * 60 * (attempt + 1)));
          }
          if (!saved) throw new HttpError(409, "The game changed while saving. Try again.");
        }
      }
      await prac.endPractice?.(game);
      return json({ ok: true, applied, notes: noted });
    }

    throw new HttpError(404, "Not found.");
  } catch (e) {
    if (e instanceof HttpError) {
      const res = json({ error: e.message, code: e.code }, e.status);
      return e.code === "no-game" || e.code === "bad-key" ? miss(res) : res;
    }
    console.error(e);
    return json({ error: "Something went wrong on the server." }, 500);
  }
}
