import { describe, it, expect } from "vitest";
import {
  getLocationStage,
  getBusinessStage,
  getStageBadgeClass,
  getStageLabel,
  LOCATION_STAGES,
  BUSINESS_STAGES,
} from "@/lib/pipeline-stages";

describe("Pipeline Stages — Edge Cases", () => {
  it("behandelt leeren String", () => {
    expect(getLocationStage("")).toBeUndefined();
    expect(getBusinessStage("")).toBeUndefined();
    expect(getStageBadgeClass("")).toBe("bg-gray-100 text-gray-800");
    expect(getStageLabel("")).toBe("");
  });

  it("behandelt null-aehnliche Werte", () => {
    expect(getLocationStage("null")).toBeUndefined();
    expect(getLocationStage("undefined")).toBeUndefined();
  });

  it("ist case-sensitive", () => {
    expect(getLocationStage("New")).toBeUndefined();
    expect(getLocationStage("NEW")).toBeUndefined();
    expect(getLocationStage("new")).toBeDefined();
  });

  it("behandelt SQL-Injection-Strings", () => {
    expect(getLocationStage("'; DROP TABLE locations; --")).toBeUndefined();
    expect(getStageBadgeClass("'; DROP TABLE locations; --")).toBe(
      "bg-gray-100 text-gray-800",
    );
  });

  it("behandelt sehr lange Strings", () => {
    expect(getLocationStage("x".repeat(10000))).toBeUndefined();
  });

  it("alle Stages haben eindeutige Keys", () => {
    const locKeys = LOCATION_STAGES.map((s) => s.key);
    expect(new Set(locKeys).size).toBe(locKeys.length);

    const bizKeys = BUSINESS_STAGES.map((s) => s.key);
    expect(new Set(bizKeys).size).toBe(bizKeys.length);
  });

  it("keine Ueberlappung zwischen Location und Business Stage Keys", () => {
    // "new" ist absichtlich in beiden — aber "scraping" nur in Location etc.
    const locOnlyKeys = LOCATION_STAGES.filter(
      (s) => !["new"].includes(s.key),
    ).map((s) => s.key);
    const bizOnlyKeys = BUSINESS_STAGES.filter(
      (s) => !["new"].includes(s.key),
    ).map((s) => s.key);

    for (const key of locOnlyKeys) {
      expect(bizOnlyKeys).not.toContain(key);
    }
  });
});
