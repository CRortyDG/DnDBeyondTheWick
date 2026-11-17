"use client";

import type { ReactNode } from "react";

export type Screen = "fight" | "map" | "chronicle" | "discovery" | "sheet" | "purse" | "jobs";

type Tab = { id: Screen; label: string; icon: ReactNode; count?: number; alert?: boolean; alertText?: string };

const svg = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

export const NAV_ICONS = {
  story: svg(
    <>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17a3 3 0 0 1 3-3h11M9 8h6" />
    </>,
  ),
  discover: svg(
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>,
  ),
  map: svg(
    <>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>,
  ),
  gold: svg(
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>,
  ),
  character: svg(
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>,
  ),
  jobs: svg(
    <>
      <path d="M6 3h12v18l-6-3-6 3z" />
      <circle cx="12" cy="8" r="1.4" />
    </>,
  ),
  fight: svg(
    <>
      <path d="M14.5 3.5 20 9l-9 9-5.5-5.5z" />
      <path d="M4 20l3-3M9 9l6 6" />
    </>,
  ),
  d20: (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 2 21 7v10l-9 5-9-5V7z" />
      <path d="M12 2 7.5 14.5h9zM3 7l4.5 7.5M21 7l-4.5 7.5M12 22v-7.5M7.5 14.5 3 17M16.5 14.5 21 17" />
    </svg>
  ),
};

/** The phone's bottom tab bar, or the tabs down the side on a computer. */
export function PlayerNav({
  screen,
  onScreen,
  hasMaps,
  discoverCount,
  jobsCount,
  fight,
  voteOpen,
  vertical,
  sheetOff,
  has = () => true,
}: {
  screen: Screen;
  onScreen: (s: Screen) => void;
  hasMaps: boolean;
  discoverCount: number;
  jobsCount: number;
  /** A fight is on: its tab leads, and lights up when you're next or it's your turn. */
  fight: "on" | "next" | "turn" | null;
  /** A vote on the leads is open and this player hasn't voted: the Discover tab lights up. */
  voteOpen?: boolean;
  vertical?: boolean;
  /** No character sheet for this player: no Character tab. */
  sheetOff?: boolean;
  /** Feature switches: a tab whose feature is off (for the table, for me, or hidden by me) isn't there. */
  has?: (id: "chronicle" | "discover" | "maps" | "gold" | "jobs") => boolean;
}) {
  const tabs: Tab[] = [
    ...(fight ? [{ id: "fight" as const, label: "Fight", icon: NAV_ICONS.fight, alert: fight !== "on", alertText: fight === "turn" ? "your turn" : "you're up next" }] : []),
    ...(has("chronicle") ? [{ id: "chronicle" as const, label: "Story", icon: NAV_ICONS.story }] : []),
    ...(has("discover") ? [{ id: "discovery" as const, label: "Discover", icon: NAV_ICONS.discover, count: discoverCount, alert: !!voteOpen, alertText: "a vote is open" }] : []),
    ...(hasMaps && has("maps") ? [{ id: "map" as const, label: "Map", icon: NAV_ICONS.map }] : []),
    ...(!sheetOff ? [{ id: "sheet" as const, label: "Character", icon: NAV_ICONS.character }] : []),
    ...(has("gold") ? [{ id: "purse" as const, label: "Gold", icon: NAV_ICONS.gold }] : []),
    ...(has("jobs") ? [{ id: "jobs" as const, label: "Jobs", icon: NAV_ICONS.jobs, count: jobsCount }] : []),
  ];
  if (!tabs.length) return null;
  return (
    <nav className={vertical ? "pl-side-nav" : "pl-nav"} aria-label="Your page">
      <div className="pl-nav-in" role="tablist" aria-orientation={vertical ? "vertical" : undefined} style={vertical ? undefined : { gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={screen === t.id} aria-label={[t.label, t.count ? `${t.count} new` : "", t.alert ? t.alertText ?? "" : ""].filter(Boolean).join(", ")} className={`pl-nav-tab${screen === t.id ? " on" : ""}${t.alert ? " alert" : ""}${t.id === "fight" ? " fight" : ""}`} onClick={() => onScreen(t.id)}>
            <span className="pl-nav-icon">
              {t.icon}
              {t.alert ? <span className={`pl-nav-alert${t.count ? " left" : ""}`} aria-hidden="true" /> : null}
              {t.count ? (
                <span className="pl-nav-count" aria-hidden="true">
                  {t.count > 99 ? "99+" : t.count}
                </span>
              ) : null}
            </span>
            <span className="pl-nav-label" aria-hidden="true">
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
