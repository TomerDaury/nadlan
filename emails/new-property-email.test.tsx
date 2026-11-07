import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import { NEW_PROPERTY_SUBJECT, NewPropertyEmail } from "@/emails/new-property-email";

const personalUrl = "https://example.test/r/abc";
const props = {
  name: "דנה",
  property: {
    title: "דירת 4 חדרים עם מרפסת",
    price: "₪ 1,950,000",
    details: "נווה צדק · 4 חד' · 95 מ\"ר",
    imageUrl: "https://example.test/image.jpg",
    url: `${personalUrl}/properties/1`,
  },
  criteria: ["אזור: תל אביב • נווה צדק", "מחיר בתקציב שלכם", "4 חדרים, בטווח שביקשתם"],
  personalUrl,
  unsubscribeUrl: `${personalUrl}/unsubscribe`,
};

describe("NewPropertyEmail (PRD F6)", () => {
  it("is Hebrew and right-to-left, with the property, the criteria it meets and both links", async () => {
    const html = await render(<NewPropertyEmail {...props} />);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="he"');
    expect(html).toContain("נכנס נכס חדש שמתאים לכם");
    expect(html).toContain(props.property.title);
    expect(html).toContain(props.property.imageUrl);
    for (const line of props.criteria) expect(html).toContain(line);
    expect(html).toContain(`href="${props.property.url}"`);
    expect(html).toContain(`href="${personalUrl}"`);
    expect(html).toContain(`href="${personalUrl}/unsubscribe"`);
    expect(html).toContain("הפסקת עדכונים");
    expect(NEW_PROPERTY_SUBJECT).toBe("נכס חדש שמתאים לכם");
  });

  it("works without an image", async () => {
    const html = await render(<NewPropertyEmail {...props} property={{ ...props.property, imageUrl: null }} />);
    expect(html).not.toContain("<img");
    expect(html).toContain(props.property.title);
  });
});
