import type { ReactNode } from "react";
import { Body, Column, Container, Head, Html, Link, Preview, Row, Section, Text } from "@react-email/components";

// Shared frame for every email (PRD F4, F6): Hebrew, RTL, one column up to 600px so it reads
// well on mobile. Colors and shapes follow the style guide (DESIGN.md §2); inline styles only,
// because email clients ignore stylesheets.

export const color = {
  brand: "#ff7a1a",
  brandText: "#b5530f",
  tint: "#fff1e6",
  ink: "#2b2b2b",
  slate: "#6b6b6b",
  muted: "#8a8a8a",
  line: "#e3e3e3",
  mist: "#f4f4f4",
};

export const font = "Rubik, 'Segoe UI', Arial, Helvetica, sans-serif";

export const text = { margin: 0, fontFamily: font, color: color.ink, textAlign: "right" as const, direction: "rtl" as const };

export const primaryButton = {
  display: "block",
  padding: "14px 20px",
  borderRadius: 12,
  backgroundColor: color.brand,
  color: "#ffffff",
  fontFamily: font,
  fontSize: 16,
  fontWeight: 500,
  textAlign: "center" as const,
};

export const secondaryButton = {
  display: "block",
  padding: "10px 16px",
  border: `1px solid ${color.brand}`,
  borderRadius: 12,
  color: "#e5650a",
  fontFamily: font,
  fontSize: 14,
  fontWeight: 500,
  textAlign: "center" as const,
};

export function EmailLayout({
  preview,
  unsubscribeUrl,
  children,
}: {
  preview: string;
  unsubscribeUrl: string;
  children: ReactNode;
}) {
  return (
    <Html lang="he" dir="rtl">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "24px 0", backgroundColor: color.mist, fontFamily: font, direction: "rtl" }}>
        <Container style={{ maxWidth: 600, width: "100%", margin: "0 auto", padding: "0 12px" }}>
          {/* Header: the logo mark (orange square with a house) and the business name placeholder. */}
          <Section style={{ marginBottom: 20 }}>
            <Row>
              <Column align="right">
                <Text style={{ ...text, fontSize: 16, fontWeight: 500 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 28,
                      height: 28,
                      lineHeight: "28px",
                      borderRadius: 8,
                      backgroundColor: color.brand,
                      color: "#ffffff",
                      textAlign: "center",
                      marginLeft: 8,
                      verticalAlign: "middle",
                    }}
                  >
                    ⌂
                  </span>
                  לוגו
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ backgroundColor: "#ffffff", borderRadius: 20, padding: "28px 24px" }}>{children}</Section>

          {/* Every email includes a way to stop updates (PRD §5 B). */}
          <Text style={{ ...text, fontSize: 12, color: color.muted, lineHeight: "18px", marginTop: 16, textAlign: "center" }}>
            קיבלתם את המייל הזה כי שלחתם פנייה לחיפוש נכס.{" "}
            <Link href={unsubscribeUrl} style={{ color: color.slate, textDecoration: "underline" }}>
              הפסקת עדכונים
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
