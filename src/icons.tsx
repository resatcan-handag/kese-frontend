import type { ReactNode } from "react";

export type IconName =
  | "home"
  | "list"
  | "budget"
  | "settings"
  | "plus"
  | "spark"
  | "up"
  | "chev"
  | "arrow"
  | "x"
  | "search"
  | "left"
  | "right"
  | "check"
  | "upload"
  | "logout"
  | "pencil";

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6 10.5V19h12v-8.5" />
    </>
  ),
  list: <path d="M4 7h16M4 12h16M4 17h11" />,
  budget: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 12V4.5M12 12l5.3 5.3" />
    </>
  ),
  settings: (
    <>
      <path d="M4 8h7M17 8h3" />
      <circle cx="14" cy="8" r="2.3" />
      <path d="M4 16h3M13 16h7" />
      <circle cx="10" cy="16" r="2.3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  spark: (
    <>
      <path d="M12 4l1.7 4.5L18 10l-4.3 1.5L12 16l-1.7-4.5L6 10l4.3-1.5z" />
      <path d="M18.5 14l.8 2 .9.8-2 .9-.8 1.9-.9-1.9-2-.9 2-.8z" />
    </>
  ),
  up: <path d="M7 17 17 7M9 7h8v8" />,
  chev: <path d="M6 9l6 6 6-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-3.6-3.6" />
    </>
  ),
  left: <path d="M14 6l-6 6 6 6" />,
  right: <path d="M10 6l6 6-6 6" />,
  check: <path d="M5 12l4.5 4.5L19 7" />,
  upload: (
    <>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M5 16v3h14v-3" />
    </>
  ),
  logout: (
    <>
      <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
      <path d="M10 12h10M17 9l3 3-3 3" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17.5V20z" />
      <path d="M13.5 7.5l3 3" />
    </>
  ),
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="ic"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
