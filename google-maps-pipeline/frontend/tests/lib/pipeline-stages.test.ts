import { describe, it, expect } from "vitest";
import {
  LOCATION_STAGES,
  BUSINESS_STAGES,
  LOCATION_FLOW_STAGES,
  LOCATION_ERROR_STAGES,
  BUSINESS_FLOW_STAGES,
  BUSINESS_EXIT_STAGES,
  STAGE_COLOR_MAP,
  getLocationStage,
  getBusinessStage,
  getStageBadgeClass,
  getStageLabel,
} from "@/lib/pipeline-stages";

describe("LOCATION_STAGES", () => {
  it("enthaelt alle 5 Location Stages", () => {
    expect(LOCATION_STAGES).toHaveLength(5);
    const keys = LOCATION_STAGES.map((s) => s.key);
    expect(keys).toEqual(["new", "scraping", "scraped", "imported", "failed_scrape"]);
  });

  it("jeder Stage hat label, color und badgeClass", () => {
    for (const stage of LOCATION_STAGES) {
      expect(stage.label).toBeTruthy();
      expect(stage.color).toBeTruthy();
      expect(stage.badgeClass).toBeTruthy();
    }
  });
});

describe("BUSINESS_STAGES", () => {
  it("enthaelt alle 7 Business Stages", () => {
    expect(BUSINESS_STAGES).toHaveLength(7);
    const keys = BUSINESS_STAGES.map((s) => s.key);
    expect(keys).toEqual([
      "new",
      "qualified",
      "unqualified",
      "enriching",
      "enriched",
      "failed_enrich",
      "exported",
    ]);
  });
});

describe("LOCATION_FLOW_STAGES / LOCATION_ERROR_STAGES", () => {
  it("Flow-Stages enthalten kein failed_scrape", () => {
    expect(LOCATION_FLOW_STAGES.find((s) => s.key === "failed_scrape")).toBeUndefined();
  });

  it("Error-Stages enthalten nur failed_scrape", () => {
    expect(LOCATION_ERROR_STAGES).toHaveLength(1);
    expect(LOCATION_ERROR_STAGES[0]!.key).toBe("failed_scrape");
  });
});

describe("BUSINESS_FLOW_STAGES / BUSINESS_EXIT_STAGES", () => {
  it("Flow-Stages enthalten weder unqualified noch failed_enrich", () => {
    const keys = BUSINESS_FLOW_STAGES.map((s) => s.key);
    expect(keys).not.toContain("unqualified");
    expect(keys).not.toContain("failed_enrich");
  });

  it("Exit-Stages definieren korrekte Abzweigungen", () => {
    expect(BUSINESS_EXIT_STAGES).toHaveLength(2);
    expect(BUSINESS_EXIT_STAGES[0]!.afterKey).toBe("new");
    expect(BUSINESS_EXIT_STAGES[0]!.stage.key).toBe("unqualified");
    expect(BUSINESS_EXIT_STAGES[1]!.afterKey).toBe("enriching");
    expect(BUSINESS_EXIT_STAGES[1]!.stage.key).toBe("failed_enrich");
  });
});

describe("STAGE_COLOR_MAP", () => {
  it("hat Eintraege fuer alle verwendeten Farben", () => {
    const allColors = [
      ...LOCATION_STAGES.map((s) => s.color),
      ...BUSINESS_STAGES.map((s) => s.color),
    ];
    for (const color of allColors) {
      expect(STAGE_COLOR_MAP[color]).toBeDefined();
      expect(STAGE_COLOR_MAP[color]!.bg).toBeTruthy();
      expect(STAGE_COLOR_MAP[color]!.text).toBeTruthy();
      expect(STAGE_COLOR_MAP[color]!.ring).toBeTruthy();
      expect(STAGE_COLOR_MAP[color]!.bar).toBeTruthy();
    }
  });
});

describe("getLocationStage", () => {
  it("findet bekannte Location Stages", () => {
    expect(getLocationStage("new")).toBeDefined();
    expect(getLocationStage("new")!.label).toBe("Neu");
  });

  it("gibt undefined fuer unbekannte Stages", () => {
    expect(getLocationStage("invalid")).toBeUndefined();
  });
});

describe("getBusinessStage", () => {
  it("findet bekannte Business Stages", () => {
    expect(getBusinessStage("exported")).toBeDefined();
    expect(getBusinessStage("exported")!.label).toBe("Exportiert");
  });

  it("gibt undefined fuer unbekannte Stages", () => {
    expect(getBusinessStage("invalid")).toBeUndefined();
  });
});

describe("getStageBadgeClass", () => {
  it("gibt Badge-Klasse fuer Location Stage", () => {
    expect(getStageBadgeClass("new")).toContain("bg-blue");
  });

  it("gibt Badge-Klasse fuer Business Stage", () => {
    expect(getStageBadgeClass("exported")).toContain("bg-purple");
  });

  it("gibt Fallback fuer unbekannte Stages", () => {
    expect(getStageBadgeClass("unknown")).toBe("bg-gray-100 text-gray-800");
  });
});

describe("getStageLabel", () => {
  it("gibt Label fuer Location Stage", () => {
    expect(getStageLabel("scraping")).toBe("Scraping");
  });

  it("gibt Label fuer Business Stage", () => {
    expect(getStageLabel("enriched")).toBe("Enriched");
  });

  it("gibt Key zurueck fuer unbekannte Stages", () => {
    expect(getStageLabel("custom_stage")).toBe("custom_stage");
  });
});
