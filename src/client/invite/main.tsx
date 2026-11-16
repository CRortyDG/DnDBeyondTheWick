import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { normaliseGameId } from "@/shared/handles";
import { isInviteCode } from "@/shared/invites";
import { InviteApp } from "./InviteApp";
import "./invite.css";

// /i/<code>?game=<campaign>: a session invite.
const url = new URL(window.location.href);
const m = /^\/i\/([^/]+)\/?$/.exec(url.pathname);
const code = m && isInviteCode(m[1]) ? m[1] : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InviteApp code={code} game={normaliseGameId(url.searchParams.get("game"))} />
  </StrictMode>,
);
