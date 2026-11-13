import { ArrivalApp } from "@/client/arrival/ArrivalApp";
import { normaliseGameId } from "@/shared/handles";

/** The generic link: the intro plays, then it asks for the link the DM sent. */
export default async function ArrivePage({ searchParams }: { searchParams: Promise<{ game?: string }> }) {
  const { game } = await searchParams;
  return <ArrivalApp code={null} game={normaliseGameId(game)} />;
}
