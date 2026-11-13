
import { useEffect, useState } from "react";
import { hasGameInUrl, readIdent, type Ident } from "./api";
import { DmApp } from "./dm/DmApp";
import { Home } from "./Home";
import { Landing } from "./Landing";
import { PlayerApp } from "./player/PlayerApp";
import { TvApp } from "./tv/TvApp";

/** Everything is driven by ?game= and ?player= (and the DM key, after the # or saved on this device). */
export function App() {
  const [ident, setIdent] = useState<Ident | null>(null);
  useEffect(() => {
    const i = readIdent();
    setIdent(i);
    const role = (i.player ?? "").toLowerCase();
    document.documentElement.dataset.view = !i.player ? "landing" : role === "tv" ? "tv" : role === "dm" ? "dm" : "player";
  }, []);

  if (!ident) return null;
  const role = (ident.player ?? "").trim().toLowerCase();
  if (!role) return hasGameInUrl() ? <Landing game={ident.game} /> : <Home />;
  if (role === "tv") return <TvApp ident={ident} />;
  if (role === "dm") return <DmApp ident={ident} />;
  return <PlayerApp ident={ident} />;
}
