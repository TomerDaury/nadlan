import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn with the design's custom text sizes", () => {
  it("keeps a text color next to a custom text size", () => {
    expect(cn("bg-brand-500 text-white h-12 px-6 text-body")).toContain("text-white");
    expect(cn("text-ink text-small").split(" ")).toEqual(["text-ink", "text-small"]);
  });

  it("still lets a later size or color win", () => {
    expect(cn("text-h2 text-h3")).toBe("text-h3");
    expect(cn("text-ink text-white")).toBe("text-white");
  });
});
