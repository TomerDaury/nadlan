import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import { ResultsEmail, resultsSubject } from "@/emails/results-email";

const personalUrl = "https://example.test/r/abc";
const match = {
  title: "דירת 4 חדרים עם מרפסת",
  price: "₪ 2,450,000",
  details: "הצפון הישן · 4 חד' · 95 מ\"ר · קומה 3",
  reason: "הנכס נמצא בשכונת הצפון הישן.",
  imageUrl: "https://example.test/image.jpg",
  url: `${personalUrl}/properties/1`,
};

describe("ResultsEmail (PRD F4)", () => {
  it("is Hebrew and right-to-left, with the properties, reasons and both links", async () => {
    const html = await render(
      <ResultsEmail name="דנה" matches={[match]} personalUrl={personalUrl} unsubscribeUrl={`${personalUrl}/unsubscribe`} />
    );
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="he"');
    expect(html).toContain("מצאנו עבורכם נכס אחד");
    expect(html).toContain(match.title);
    expect(html).toContain(match.reason);
    expect(html).toContain(match.imageUrl);
    expect(html).toContain(`href="${personalUrl}"`);
    expect(html).toContain(`href="${personalUrl}/unsubscribe"`);
    expect(html).toContain("הפסקת עדכונים");
    // Fewer than 3 results: a note about future updates.
    expect(html).toContain("נעדכן אתכם במייל");
  });

  it("confirms the request when nothing matched", async () => {
    const html = await render(
      <ResultsEmail name="דנה" matches={[]} personalUrl={personalUrl} unsubscribeUrl={`${personalUrl}/unsubscribe`} />
    );
    expect(html).toContain("הפנייה שלכם התקבלה");
    expect(html).toContain("לא נמצאו כרגע נכסים");
    expect(html).toContain(`href="${personalUrl}/unsubscribe"`);
    expect(resultsSubject(0)).toBe("הפנייה שלכם התקבלה");
    expect(resultsSubject(2)).toBe("הנכסים שמתאימים לכם");
  });
});
