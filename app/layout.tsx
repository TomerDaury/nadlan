import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { DirectionProvider } from "@/components/direction-provider";
import "./globals.css";

// Rubik variable font: covers weights 400 (regular), 500 (medium), 600 (semibold).
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "מערכת התאמת נכסים",
  description: "מלאו כמה פרטים ונציג לכם עד 3 נכסים מתאימים",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <DirectionProvider>{children}</DirectionProvider>
      </body>
    </html>
  );
}
