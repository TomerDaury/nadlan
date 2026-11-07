import { Button, Img, Link, Section, Text } from "@react-email/components";
import { EmailLayout, color, primaryButton, secondaryButton, text } from "@/emails/email-layout";

// "New property" update email (PRD F6): the property's details, an image, the criteria it meets
// and links to it and to the personal page. No written reason: updates are not compared with the
// client's free text (PRD §6).

export type NewPropertyEmailProps = {
  name: string;
  property: {
    title: string;
    price: string;
    details: string;
    imageUrl: string | null;
    url: string;
  };
  /** One line per criterion the property meets: area, budget, rooms. */
  criteria: string[];
  personalUrl: string;
  unsubscribeUrl: string;
};

export const NEW_PROPERTY_SUBJECT = "נכס חדש שמתאים לכם";

export function NewPropertyEmail({ name, property, criteria, personalUrl, unsubscribeUrl }: NewPropertyEmailProps) {
  const headline = `שלום ${name}, נכנס נכס חדש שמתאים לכם`;
  return (
    <EmailLayout preview={`${headline}: ${property.title}`} unsubscribeUrl={unsubscribeUrl}>
      <Text style={{ ...text, fontSize: 24, fontWeight: 500, lineHeight: "32px" }}>{headline}</Text>
      <Text style={{ ...text, fontSize: 16, color: color.slate, lineHeight: "24px", marginTop: 8, marginBottom: 24 }}>
        הנכס הזה נוסף עכשיו למאגר, והוא עומד בקריטריונים של הפנייה שלכם.
      </Text>

      <Section style={{ border: `1px solid ${color.line}`, borderRadius: 16, overflow: "hidden", marginBottom: 20, backgroundColor: "#ffffff" }}>
        {property.imageUrl && (
          <Link href={property.url}>
            <Img
              src={property.imageUrl}
              alt={property.title}
              width="100%"
              style={{ display: "block", width: "100%", maxHeight: 320, objectFit: "cover" }}
            />
          </Link>
        )}
        <Section style={{ padding: "16px 20px 20px" }}>
          <Text style={{ ...text, fontSize: 18, fontWeight: 500, lineHeight: "26px" }}>{property.title}</Text>
          {/* Prices stay left-to-right inside Hebrew text (DESIGN §2.5). */}
          <Text style={{ ...text, fontSize: 18, fontWeight: 600, lineHeight: "26px" }}>
            <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
              {property.price}
            </span>
          </Text>
          <Text style={{ ...text, fontSize: 14, color: color.slate, lineHeight: "22px", marginTop: 4 }}>{property.details}</Text>
          <Section style={{ backgroundColor: color.tint, borderRadius: 12, padding: "12px 16px", marginTop: 14 }}>
            <Text style={{ ...text, fontSize: 14, fontWeight: 500, color: color.brandText, lineHeight: "22px" }}>
              הנכס עומד בקריטריונים שלכם
            </Text>
            {criteria.map((line) => (
              <Text key={line} style={{ ...text, fontSize: 14, lineHeight: "22px", marginTop: 4 }}>
                ✓ {line}
              </Text>
            ))}
          </Section>
          <Button href={property.url} style={{ ...secondaryButton, marginTop: 16 }}>
            לפרטי הנכס
          </Button>
        </Section>
      </Section>

      <Button href={personalUrl} style={primaryButton}>
        לדף האישי שלי
      </Button>
      <Text style={{ ...text, fontSize: 13, color: color.muted, lineHeight: "20px", marginTop: 12, textAlign: "center" }}>
        בדף האישי אפשר לראות את כל הנכסים, לעדכן את הקריטריונים ולנהל את העדכונים במייל.
      </Text>
    </EmailLayout>
  );
}

export default NewPropertyEmail;
