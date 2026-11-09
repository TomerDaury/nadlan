import { describe, expect, it } from "vitest";
import { displayPhone, normalizePhone, phoneHref, whatsappHref, whatsappMessage } from "@/lib/contact";

const property = { title: "דירת 4 חדרים עם מרפסת", neighborhood: "נווה צדק", city: "תל אביב" };

describe("normalizePhone (agent phone, PRD F10)", () => {
  it.each([
    ["050-1234567", "972501234567"],
    ["0501234567", "972501234567"],
    ["050 123 4567", "972501234567"],
    ["(050) 123-4567", "972501234567"],
    ["+972501234567", "972501234567"],
    ["+972 50-123-4567", "972501234567"],
    ["972501234567", "972501234567"],
    ["00972501234567", "972501234567"],
    ["03-1234567", "97231234567"],
  ])("%s → %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it.each([[undefined], [null], [""], ["   "], ["abc"], ["050-12345a7"], ["123"], ["+1234567890123456"]])(
    "%s → null (buttons hidden)",
    (raw) => {
      expect(normalizePhone(raw)).toBeNull();
    }
  );
});

describe("contact links", () => {
  it("builds the call link", () => {
    expect(phoneHref("972501234567")).toBe("tel:+972501234567");
  });

  it("builds the WhatsApp link with the Hebrew message about the property", () => {
    const href = whatsappHref("972501234567", property);
    expect(href.startsWith("https://wa.me/972501234567?text=")).toBe(true);
    const text = decodeURIComponent(new URL(href).searchParams.get("text")!);
    expect(text).toBe("שלום, אני מתעניין בנכס: דירת 4 חדרים עם מרפסת (נווה צדק, תל אביב)");
    expect(text).toBe(whatsappMessage(property));
  });

  it("never includes the client's personal link", () => {
    expect(whatsappHref("972501234567", property)).not.toContain("%2Fr%2F");
    expect(whatsappMessage(property)).not.toContain("/r/");
  });
});

describe("displayPhone", () => {
  it.each([
    ["972501234567", "050-1234567"],
    ["97231234567", "03-1234567"],
    ["14155550100", "+14155550100"],
  ])("%s → %s", (phone, expected) => {
    expect(displayPhone(phone)).toBe(expected);
  });
});
