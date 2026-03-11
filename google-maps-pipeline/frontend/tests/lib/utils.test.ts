import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className merge)", () => {
  it("kombiniert mehrere Klassen", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("merged Tailwind-Konflikte korrekt", () => {
    // twMerge loest Konflikte: letzter gewinnt
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("behandelt undefined und null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("behandelt leere Strings", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("behandelt bedingte Klassen", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");

    const isDisabled = false;
    expect(cn("base", isDisabled && "disabled")).toBe("base");
  });

  it("gibt leeren String bei keinen Argumenten", () => {
    expect(cn()).toBe("");
  });
});
