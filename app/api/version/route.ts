import { guard, json, params } from "@/server/http";
import { getStore } from "@/server/store";

export const dynamic = "force-dynamic";

/** Cheap safety-net poll: just the version number. */
export async function GET(req: Request) {
  return guard(async () => json({ version: await getStore().version(params(req).game) }));
}
