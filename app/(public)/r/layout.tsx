import type { Metadata } from "next";

// Personal-link pages must never be indexed (ARCHITECTURE §2.7).
// Referrer-Policy: same-origin is set for /r/* in next.config.ts (ADR-16).
export const metadata: Metadata = {
  title: "הנכסים שלכם",
  robots: { index: false, follow: false },
};

export default function PersonalLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
