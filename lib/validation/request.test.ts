import { describe, expect, it } from "vitest";
import { isInAreas, parseCriteria, parseRequest, requestFormValues } from "@/lib/validation/request";

const valid = {
  submission_id: "3f1c2a8e-7b4d-4c1e-9a2f-6d5e8b7c9a10",
  name: "דנה כהן",
  email: "Dana@Example.com",
  phone: "",
  city: "תל אביב",
  neighborhoods: ["הצפון הישן"],
  max_budget: "2000000",
  rooms_min: "3.5",
  rooms_max: "4",
  preferences_text: "שקט, קרוב לגנים",
};

const errorsOf = (values: Record<string, unknown>) => {
  const result = parseRequest(values);
  return result.success ? {} : result.fieldErrors;
};

describe("parseRequest", () => {
  it("accepts a valid request, lower-cases the email and turns an empty phone into null", () => {
    const result = parseRequest(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      email: "dana@example.com",
      phone: null,
      max_budget: 2000000,
      rooms_min: 3.5,
      rooms_max: 4,
      neighborhoods: ["הצפון הישן"],
    });
  });

  it("accepts equal min and max rooms", () => {
    expect(parseRequest({ ...valid, rooms_min: "4", rooms_max: "4" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(errorsOf({ ...valid, email: "not-an-email" }).email).toBe("כתובת האימייל אינה תקינה");
  });

  it("rejects an invalid phone but accepts common formats", () => {
    expect(errorsOf({ ...valid, phone: "abc" }).phone).toBe("מספר הטלפון אינו תקין");
    expect(errorsOf({ ...valid, phone: "123" }).phone).toBe("מספר הטלפון אינו תקין");
    expect(parseRequest({ ...valid, phone: "050-1234567" }).success).toBe(true);
    expect(parseRequest({ ...valid, phone: "+972 50 123 4567" }).success).toBe(true);
  });

  it("rejects a zero or negative budget", () => {
    expect(errorsOf({ ...valid, max_budget: "0" }).max_budget).toBe("התקציב חייב להיות גדול מ-0");
    expect(errorsOf({ ...valid, max_budget: "-5" }).max_budget).toBe("התקציב חייב להיות גדול מ-0");
    expect(errorsOf({ ...valid, max_budget: "" }).max_budget).toBe("יש להזין תקציב");
  });

  it("rejects a reversed rooms range next to the rooms field", () => {
    expect(errorsOf({ ...valid, rooms_min: "5", rooms_max: "3" }).rooms_max).toBe(
      "מספר החדרים המינימלי גדול מהמקסימלי"
    );
  });

  it("shows the reversed rooms message together with other field errors", () => {
    const errors = errorsOf({ ...valid, email: "x", rooms_min: "5", rooms_max: "3" });
    expect(errors.email).toBeDefined();
    expect(errors.rooms_max).toBe("מספר החדרים המינימלי גדול מהמקסימלי");
  });

  it("rejects rooms that are not whole or half", () => {
    expect(errorsOf({ ...valid, rooms_min: "3.3" }).rooms_min).toBeDefined();
  });

  it("requires name, city, at least one neighborhood and the free text", () => {
    const errors = errorsOf({ ...valid, name: " ", city: "", neighborhoods: [], preferences_text: "" });
    expect(errors.name).toBe("יש להזין שם מלא");
    expect(errors.city).toBe("יש לבחור עיר");
    expect(errors.neighborhoods).toBe("יש לבחור לפחות שכונה אחת");
    expect(errors.preferences_text).toBe("ספרו לנו מה הכי חשוב לכם בנכס");
  });

  it("requires a submission id", () => {
    expect(errorsOf({ ...valid, submission_id: "" }).submission_id).toBeDefined();
  });
});

describe("requestFormValues", () => {
  it("reads repeated neighborhoods fields as a list", () => {
    const form = new FormData();
    form.set("name", "דנה");
    form.append("neighborhoods", "א");
    form.append("neighborhoods", "ב");
    const values = requestFormValues(form);
    expect(values.name).toBe("דנה");
    expect(values.neighborhoods).toEqual(["א", "ב"]);
    expect(values.phone).toBeUndefined();
  });
});

describe("isInAreas", () => {
  const areas = [{ city: "תל אביב", neighborhoods: ["הצפון הישן", "נווה צדק"] }];

  it("accepts a city and neighborhoods from the list", () => {
    expect(isInAreas({ city: "תל אביב", neighborhoods: ["נווה צדק"] }, areas)).toBe(true);
  });

  it("rejects an unknown city or a neighborhood from another city", () => {
    expect(isInAreas({ city: "חיפה", neighborhoods: ["נווה צדק"] }, areas)).toBe(false);
    expect(isInAreas({ city: "תל אביב", neighborhoods: ["הדר"] }, areas)).toBe(false);
  });
});

describe("parseCriteria (updating criteria, PRD F5)", () => {
  const criteria = {
    city: "תל אביב",
    neighborhoods: ["הצפון הישן"],
    max_budget: "2500000",
    rooms_min: "3",
    rooms_max: "4",
    preferences_text: "שקט",
  };

  it("accepts the criteria without any personal details", () => {
    const result = parseCriteria(criteria);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty("email");
  });

  it("blocks a zero budget and a reversed rooms range", () => {
    const result = parseCriteria({ ...criteria, max_budget: "0", rooms_min: "5", rooms_max: "3" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.max_budget).toBeDefined();
      expect(result.fieldErrors.rooms_max).toBe("מספר החדרים המינימלי גדול מהמקסימלי");
    }
  });

  it("requires at least one neighborhood and the free text", () => {
    const result = parseCriteria({ ...criteria, neighborhoods: [], preferences_text: " " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.neighborhoods).toBeDefined();
      expect(result.fieldErrors.preferences_text).toBeDefined();
    }
  });
});
