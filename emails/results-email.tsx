import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

// Results email (PRD F4, ARCHITECTURE §2.5). Hebrew, RTL, one column up to 600px so it reads
// well on mobile. Colors and shapes follow the style guide (DESIGN.md §2); inline styles only,
// because email clients ignore stylesheets.

export type ResultsEmailMatch = {
  title: string;
  price: string;
  details: string;
  reason: string;
  imageUrl: string | null;
  url: string;
};

export type ResultsEmailProps = {
  name: string;
  matches: ResultsEmailMatch[];
  personalUrl: string;
  unsubscribeUrl: string;
};

const color = {
  brand: "#ff7a1a",
  brandText: "#b5530f",
  tint: "#fff1e6",
  ink: "#2b2b2b",
  slate: "#6b6b6b",
  muted: "#8a8a8a",
  line: "#e3e3e3",
  mist: "#f4f4f4",
};

const font = "Rubik, 'Segoe UI', Arial, Helvetica, sans-serif";

const text = { margin: 0, fontFamily: font, color: color.ink, textAlign: "right" as const, direction: "rtl" as const };

export function resultsSubject(count: number): string {
  return count ? "הנכסים שמתאימים לכם" : "הפנייה שלכם התקבלה";
}

function headline(name: string, count: number): string {
  if (count === 0) return `שלום ${name}, הפנייה שלכם התקבלה`;
  if (count === 1) return `שלום ${name}, מצאנו עבורכם נכס אחד`;
  return `שלום ${name}, מצאנו עבורכם ${count} נכסים`;
}

const FUTURE_UPDATES = "נעדכן אתכם במייל כשייכנס נכס שמתאים לכם.";

function MatchCard({ match }: { match: ResultsEmailMatch }) {
  return (
    <Section style={{ border: `1px solid ${color.line}`, borderRadius: 16, overflow: "hidden", marginBottom: 20, backgroundColor: "#ffffff" }}>
      {match.imageUrl && (
        <Link href={match.url}>
          <Img src={match.imageUrl} alt={match.title} width="100%" style={{ display: "block", width: "100%", maxHeight: 320, objectFit: "cover" }} />
        </Link>
      )}
      <Section style={{ padding: "16px 20px 20px" }}>
        <Text style={{ ...text, fontSize: 18, fontWeight: 500, lineHeight: "26px" }}>{match.title}</Text>
        {/* Prices stay left-to-right inside Hebrew text (DESIGN §2.5). */}
        <Text style={{ ...text, fontSize: 18, fontWeight: 600, lineHeight: "26px" }}>
          <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
            {match.price}
          </span>
        </Text>
        <Text style={{ ...text, fontSize: 14, color: color.slate, lineHeight: "22px", marginTop: 4 }}>{match.details}</Text>
        <Section style={{ backgroundColor: color.tint, borderRadius: 12, padding: "12px 16px", marginTop: 14 }}>
          <Text style={{ ...text, fontSize: 14, fontWeight: 500, color: color.brandText, lineHeight: "22px" }}>למה זה מתאים לכם</Text>
          <Text style={{ ...text, fontSize: 14, lineHeight: "22px", marginTop: 4 }}>{match.reason}</Text>
        </Section>
        <Button
          href={match.url}
          style={{
            display: "block",
            marginTop: 16,
            padding: "10px 16px",
            border: `1px solid ${color.brand}`,
            borderRadius: 12,
            color: "#e5650a",
            fontFamily: font,
            fontSize: 14,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          לפרטים
        </Button>
      </Section>
    </Section>
  );
}

export function ResultsEmail({ name, matches, personalUrl, unsubscribeUrl }: ResultsEmailProps) {
  const count = matches.length;
  return (
    <Html lang="he" dir="rtl">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Preview>{count ? headline(name, count) : "לא נמצאו כרגע נכסים מתאימים. נעדכן אתכם כשייכנס נכס כזה."}</Preview>
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

          <Section style={{ backgroundColor: "#ffffff", borderRadius: 20, padding: "28px 24px" }}>
            <Text style={{ ...text, fontSize: 24, fontWeight: 500, lineHeight: "32px" }}>{headline(name, count)}</Text>
            <Text style={{ ...text, fontSize: 16, color: color.slate, lineHeight: "24px", marginTop: 8, marginBottom: 24 }}>
              {count === 0
                ? `לא נמצאו כרגע נכסים שמתאימים לקריטריונים שלכם. ${FUTURE_UPDATES}`
                : "אלה הנכסים שבחרנו עבורכם, ולכל אחד מהם הסבר קצר למה הוא מתאים לכם."}
            </Text>

            {matches.map((match) => (
              <MatchCard key={match.url} match={match} />
            ))}

            {count > 0 && count < 3 && (
              <Text style={{ ...text, fontSize: 14, color: color.slate, lineHeight: "22px", marginBottom: 20 }}>{FUTURE_UPDATES}</Text>
            )}

            <Button
              href={personalUrl}
              style={{
                display: "block",
                padding: "14px 20px",
                borderRadius: 12,
                backgroundColor: color.brand,
                color: "#ffffff",
                fontFamily: font,
                fontSize: 16,
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              לדף האישי שלי
            </Button>
            <Text style={{ ...text, fontSize: 13, color: color.muted, lineHeight: "20px", marginTop: 12, textAlign: "center" }}>
              בדף האישי אפשר לראות את כל הנכסים, לעדכן את הקריטריונים ולנהל את העדכונים במייל.
            </Text>
          </Section>

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

export default ResultsEmail;
