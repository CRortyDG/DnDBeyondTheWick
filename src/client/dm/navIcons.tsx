// Small line icons for the DM sidebar and top bar. Same drawing style as ui/icons.tsx.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...rest }: P) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false, ...rest };
}

export const CoinIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v9M9.6 9.8c0-1.1 1.1-1.8 2.4-1.8s2.4.6 2.4 1.7c0 2.4-4.8 1.4-4.8 4.1 0 1.1 1.1 1.8 2.4 1.8s2.4-.7 2.4-1.8" />
  </svg>
);
export const PeopleIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20c.8-3.4 3.3-5 6.5-5s5.7 1.6 6.5 5M16 5.2a3.3 3.3 0 0 1 0 6.4M18.2 15.4c1.5.7 2.5 2.3 2.9 4.6" />
  </svg>
);
export const StoreIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 9.5 5 4h14l1.5 5.5M4.5 9.5V20h15V9.5M3.5 9.5h17M10 20v-5.5h4V20" />
  </svg>
);
export const BoardIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 8h4v4H7zM14 9h3v6h-3z" />
  </svg>
);
export const MapIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 6.5 8.5 4.5l7 2 5.5-2v13l-5.5 2-7-2-5.5 2zM8.5 4.5v13M15.5 6.5v13" />
  </svg>
);
export const EyeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);
export const PinIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.2" />
  </svg>
);
export const SkullIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 11a7 7 0 0 1 14 0c0 2.4-1.1 4-2.8 5V20H7.8v-4C6.1 15 5 13.4 5 11Z" />
    <circle cx="9.3" cy="11" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="14.7" cy="11" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
export const ListIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const BookIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 5c3-1.2 6-1.2 9 .8 3-2 6-2 9-.8v14c-3-1.2-6-1.2-9 .8-3-2-6-2-9-.8zM12 5.8v14" />
  </svg>
);
export const ShipIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 15.5h18l-2.7 4.5H5.7zM12 3v12.5M12 3.8l6 8.7h-6" />
  </svg>
);
export const QuillIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 4C12 4.8 7.5 10.5 5 20M20 4c-.8 6-4.5 10.5-10.5 11.2" />
  </svg>
);
export const GearIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
  </svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </svg>
);
export const SwordIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20.5 3.5 9.5 14.5M20.5 3.5h-4l-9 9M20.5 3.5v4l-9 9M5.5 12.5l6 6M8.5 15.5 4 20" />
  </svg>
);
export const PlayIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />
  </svg>
);
export const PanelRightIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M15 4v16" />
  </svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const InfoIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.6v.2" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
