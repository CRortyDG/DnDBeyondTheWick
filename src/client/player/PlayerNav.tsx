"use client";

import type { ReactNode } from "react";

export type Screen = "map" | "chronicle" | "discovery" | "purse" | "jobs";

type Tab = { id: Screen; label: string; icon: ReactNode; count?: number };

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
  jobs: svg(
    <>
      <path d="M6 3h12v18l-6-3-6 3z" />
      <circle cx="12" cy="8" r="1.4" />
    </>,
  ),
  d20: (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 2 21 7v10l-9 5-9-5V7z" />
      <path d="M12 2 7.5 14.5h9zM3 7l4.5 7.5M21 7l-4.5 7.5M12 22v-7.5M7.5 14.5 3 17M16.5 14.5 21 17" />
    </svg>
  ),
};

/** The phone's bottom tab bar. */
export function PlayerNav({ screen, onScreen, hasMaps, discoverCount, jobsCount }: { screen: Screen; onScreen: (s: Screen) => void; hasMaps: boolean; discoverCount: number; jobsCount: number }) {
  const tabs: Tab[] = [
    { id: "chronicle", label: "Story", icon: NAV_ICONS.story },
    { id: "discovery", label: "Discover", icon: NAV_ICONS.discover, count: discoverCount },
    ...(hasMaps ? [{ id: "map" as const, label: "Map", icon: NAV_ICONS.map }] : []),
    { id: "purse", label: "Gold", icon: NAV_ICONS.gold },
    { id: "jobs", label: "Jobs", icon: NAV_ICONS.jobs, count: jobsCount },
  ];
  return (
    <nav className="pl-nav" aria-label="Your page">
      <div className="pl-nav-in" role="tablist" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={screen === t.id} className={`pl-nav-tab${screen === t.id ? " on" : ""}`} onClick={() => onScreen(t.id)}>
            <span className="pl-nav-icon">
              {t.icon}
              {t.count ? (
                <span className="pl-nav-count" aria-label={`${t.count} new`}>
                  {t.count > 99 ? "99+" : t.count}
                </span>
              ) : null}
            </span>
            <span className="pl-nav-label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
