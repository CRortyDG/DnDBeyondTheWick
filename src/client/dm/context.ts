"use client";

import { createContext, useContext } from "react";
import type { DmCommand } from "@/shared/commands";
import type { DmView } from "@/shared/projection";
import type { Ident } from "../api";
import type { CallResult } from "../useGame";

export interface DmCtx {
  view: DmView;
  ident: Ident;
  /** Send a command. Shows any error as a toast; resolves true on success. */
  run: (cmd: DmCommand, success?: string) => Promise<boolean>;
  toast: (msg: string) => void;
  /** Send a command and get the error code and server note back, with no toast. */
  call: (cmd: DmCommand) => Promise<CallResult>;
  gated: Record<string, string>;
  /** Open the full-screen editor for a map scene. */
  openMap: (sceneId: string) => void;
  /** The dice tray, which floats over the console, the fight screen and run-game mode. */
  diceOpen: boolean;
  toggleDice: () => void;
}

export const DmContext = createContext<DmCtx | null>(null);

export function useDm(): DmCtx {
  const c = useContext(DmContext);
  if (!c) throw new Error("useDm outside DmContext");
  return c;
}
