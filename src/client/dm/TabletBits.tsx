import { useEffect, useState } from "react";
import { markTabletOffered, setLayoutMode, setTabletMode, shouldOfferTablet, toggleFullScreen, useFullScreen, useLayoutMode, usePhone, useTablet, type LayoutMode, type TabletMode, useTabletMode } from "./tablet";

/** Full screen hides the browser's bars. Only shown in tablet mode, where the room matters most. */
export function FullScreenButton({ small }: { small?: boolean }) {
  const on = useTablet();
  const full = useFullScreen();
  if (!on || !document.documentElement.requestFullscreen) return null;
  return (
    <button className={`btn${small ? " small" : ""} tablet-full${full ? " on" : ""}`} type="button" aria-pressed={full} onClick={toggleFullScreen} title={full ? "Leave full screen" : "Full screen: hide the browser's bars"} aria-label={full ? "Exit full screen" : "Full screen"}>
      <FullIcon /> <span className="tablet-full-text">{full ? "Exit full screen" : "Full screen"}</span>
    </button>
  );
}

function FullIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M1.5 5.5v-4h4M10.5 1.5h4v4M14.5 10.5v4h-4M5.5 14.5h-4v-4" />
    </svg>
  );
}

/** The first time this screen is touched (with tablet mode off), offer to switch. Once per device. */
export function TabletOffer() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!shouldOfferTablet()) return;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      window.removeEventListener("pointerdown", onDown);
      if (shouldOfferTablet()) setShow(true);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  if (!show) return null;
  const close = () => {
    markTabletOffered();
    setShow(false);
  };
  return (
    <div className="tablet-offer" role="dialog" aria-label="Tablet mode">
      <span>Looks like you&rsquo;re using touch. Switch to tablet mode?</span>
      <button
        className="btn small primary"
        type="button"
        onClick={() => {
          setTabletMode("on");
          setShow(false);
        }}
      >
        Switch
      </button>
      <button className="btn small" type="button" onClick={close}>
        Not now
      </button>
    </div>
  );
}

const MODES: { id: TabletMode; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "on", label: "On" },
  { id: "auto", label: "Only when folded" },
];

const LAYOUTS: { id: LayoutMode; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "phone", label: "Phone" },
  { id: "desktop", label: "Desktop" },
];

/** Settings → This device. */
export function TabletSetting() {
  const mode = useTabletMode();
  const layout = useLayoutMode();
  const phone = usePhone();
  return (
    <section className="box tablet-setting">
      <h3>This device</h3>
      <p className="note">Only changes this screen. Your players and the TV don&rsquo;t see a difference.</p>
      <div className="tablet-setting-row">
        <span id="layout-mode-label">Layout</span>
        <div className="seg" role="radiogroup" aria-labelledby="layout-mode-label">
          {LAYOUTS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={layout === m.id} className={`btn small${layout === m.id ? " on" : ""}`} onClick={() => setLayoutMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="note">
        Phone layout: one slim top bar with a ⋯ menu, pages and the TV panel along the bottom, and a number pad in fights. Auto uses it on narrow screens{phone ? " (like this one)" : ""}.
      </p>
      <div className="tablet-setting-row">
        <span id="tablet-mode-label">Tablet mode</span>
        <div className="seg" role="radiogroup" aria-labelledby="tablet-mode-label">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={`btn small${mode === m.id ? " on" : ""}`} onClick={() => setTabletMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="note">
        Bigger buttons, nothing that needs a keyboard or a mouse, a number pad in fights, swipe through the run sheet, and the screen stays awake while a session runs.
        {mode === "auto" ? " “Only when folded” goes by what the browser reports; some 2-in-1 laptops don’t report the fold, so pick On if it doesn’t switch." : ""}
      </p>
    </section>
  );
}
