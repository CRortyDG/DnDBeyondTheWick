import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./globals.css";
import "./dm-theme.css";
import "./player-theme.css";
import "./landing-theme.css";
import "./rooms.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
