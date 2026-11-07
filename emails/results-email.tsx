import { Button, Img, Link, Section, Text } from "@react-email/components";
import { EmailLayout, color, primaryButton, secondaryButton, text } from "@/emails/email-layout";

// Results email (PRD F4, ARCHITECTURE §2.5). The frame, colors and footer are in email-layout.tsx.

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
        <Button href={match.url} style={{ ...secondaryButton, marginTop: 16 }}>
          לפרטים
        </Button>
      </Section>
    </Section>
  );
}

export function ResultsEmail({ name, matches, personalUrl, unsubscribeUrl }: ResultsEmailProps) {
  const count = matches.length;
  return (
    <EmailLayout
      preview={count ? headline(name, count) : "לא נמצאו כרגע נכסים מתאימים. נעדכן אתכם כשייכנס נכס כזה."}
      unsubscribeUrl={unsubscribeUrl}
    >
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

      <Button href={personalUrl} style={primaryButton}>
        לדף האישי שלי
      </Button>
      <Text style={{ ...text, fontSize: 13, color: color.muted, lineHeight: "20px", marginTop: 12, textAlign: "center" }}>
        בדף האישי אפשר לראות את כל הנכסים, לעדכן את הקריטריונים ולנהל את העדכונים במייל.
      </Text>
    </EmailLayout>
  );
}

export default ResultsEmail;
