"use client";

import { Direction } from "radix-ui";

// Tells Radix primitives (radio group, checkbox, etc.) that the app is RTL,
// so keyboard navigation follows the right-to-left direction.
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  return <Direction.DirectionProvider dir="rtl">{children}</Direction.DirectionProvider>;
}
