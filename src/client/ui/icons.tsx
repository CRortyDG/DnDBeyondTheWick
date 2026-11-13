// Simple inline SVG icons. No emoji anywhere in the UI.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: P) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false, ...rest };
}

export function LockIcon(p: P) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CandleIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M12 2.5c2 2.6 2 4.4 0 5.6-2-1.2-2-3 0-5.6Z" fill="currentColor" stroke="none" />
      <rect x="9" y="10" width="6" height="10" rx="0.8" />
      <path d="M5 21.5h14" />
    </svg>
  );
}

export function TvIcon(p: P) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function FullscreenIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

export function EyeOffIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.5 9 6-.3.8-1.3 2.3-2.9 3.7M6.4 7.6C4.5 8.9 3.3 10.8 3 12c.5 1.5 4 6 9 6 1.4 0 2.6-.3 3.7-.8" />
    </svg>
  );
}

export function LinkIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  );
}

export function UpIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function DownIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function SealIcon(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8" fill="currentColor" stroke="none" opacity="0.9" />
      <path d="M8.5 12.5l2.3 2.3 4.7-5" stroke="#efe3c8" />
    </svg>
  );
}
