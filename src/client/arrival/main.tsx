import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { isToken } from "@/shared/arrival";
import { normaliseGameId } from "@/shared/handles";
import { ArrivalApp } from "./ArrivalApp";
import "./arrival.css";

// /arrive/<code>?game=<campaign>: a player's private link. /arrive alone is the generic link.
const url = new URL(window.location.href);
const m = /^\/arrive\/([^/]+)\/?$/.exec(url.pathname);
const code = m && isToken(m[1]) ? m[1] : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ArrivalApp code={code} game={normaliseGameId(url.searchParams.get("game"))} />
  </StrictMode>,
);
