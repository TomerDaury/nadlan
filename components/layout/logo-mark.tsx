import type { SVGProps } from "react";

// The logo mark: a house in front of a sun. Line style like the icon set (DESIGN.md §2.6):
// round caps and joins, drawn in currentColor, so it sits white on the orange logo square.
// Keep in sync with app/icon.svg and public/logo-email.png (same drawing).
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-0.7 -0.7 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {/* Sun, behind the house on the upper left */}
      <circle cx="6.5" cy="6.5" r="2.2" fill="currentColor" stroke="none" />
      <path d="M6.5 1.6v1M1.6 6.5h1M3 3l.7.7M10 3l-.7.7M3 10l.7-.7" />
      {/* House */}
      <path d="M8 13l6.5-6 6.5 6" />
      <path d="M10 11.5V21h9v-9.5" />
      <path d="M13.2 21v-4.5h2.6V21" />
    </svg>
  );
}
