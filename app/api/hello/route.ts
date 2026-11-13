import { hello } from "@/server/game";
import { guard, json, params } from "@/server/http";

export const dynamic = "force-dynamic";

/** First contact on page load: identifies the caller, creating ?player= names as needed. */
export async function POST(req: Request) {
  return guard(async () => {
    const { game, player, key } = params(req);
    return json(await hello(game, player, key));
  });
}
