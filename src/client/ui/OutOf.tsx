import { maxTotal, type DiceResult } from "@/shared/dice";
import "./dice.css";

/** "/400" after a total: the most the dice could have come to. Nothing for a single die. */
export function OutOf({ r }: { r: Pick<DiceResult, "groups" | "plus" | "keep"> }) {
  const max = maxTotal(r);
  return max === null ? null : <span className="roll-max">/{max}</span>;
}
