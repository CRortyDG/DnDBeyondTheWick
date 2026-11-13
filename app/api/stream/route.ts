import { params } from "@/server/http";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LIFETIME_MS = 270_000; // close before the function limit; EventSource reconnects by itself

/**
 * Server-sent events: "the game changed, it's version N now". Carries no game
 * data at all, so it needs no auth: each client then fetches its own filtered view.
 */
export async function GET(req: Request) {
  const { game } = params(req);
  const store = getStore();
  const enc = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (s: string) => {
        if (!closed) controller.enqueue(enc.encode(s));
      };
      const unsubscribe = store.subscribe(game, (v) => send(`event: v\ndata: ${v}\n\n`));
      const ping = setInterval(() => send(`: ping\n\n`), 20_000);
      const end = setTimeout(() => cleanup(), LIFETIME_MS);
      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(ping);
        clearTimeout(end);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", () => cleanup());
      send(`retry: 1500\n\n`);
      send(`event: v\ndata: ${await store.version(game)}\n\n`);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
