import { ArrivalApp } from "@/client/arrival/ArrivalApp";
import { isToken } from "@/shared/arrival";
import { normaliseGameId } from "@/shared/handles";

/** A player's private link. The page itself is the same for everyone; the seat data comes from /api/arrival. */
export default async function ArriveWithCode({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ game?: string }> }) {
  const { code } = await params;
  const { game } = await searchParams;
  return <ArrivalApp code={isToken(code) ? code : null} game={normaliseGameId(game)} />;
}
