import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDateTime, formatDate, formatNumber, formatDistanceToNow } from "@/lib/format";

describe("formatDateTime", () => {
  it("formatiert ein Datum mit Uhrzeit (de-DE)", () => {
    const result = formatDateTime("2026-03-04T14:30:00Z");
    expect(result).toMatch(/04\.03\.2026/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("gibt Strich zurueck bei null", () => {
    expect(formatDateTime(null)).toBe("\u2014");
  });

  it("gibt Strich zurueck bei leerem String", () => {
    // leerer String ist falsy
    expect(formatDateTime("")).toBe("\u2014");
  });
});

describe("formatDate", () => {
  it("formatiert ein Datum ohne Uhrzeit (de-DE)", () => {
    const result = formatDate("2026-03-04T14:30:00Z");
    expect(result).toMatch(/04\.03\.2026|4\.3\.2026/);
  });

  it("gibt Strich zurueck bei null", () => {
    expect(formatDate(null)).toBe("\u2014");
  });
});

describe("formatNumber", () => {
  it("formatiert Zahlen mit Tausenderpunkten", () => {
    const result = formatNumber(1234567);
    // de-DE nutzt . als Tausendertrennzeichen
    expect(result).toContain(".");
  });

  it("formatiert 0 korrekt", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formatiert negative Zahlen", () => {
    const result = formatNumber(-1000);
    expect(result).toContain("-");
  });
});

describe("formatDistanceToNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-04T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("zeigt 'gerade eben' fuer weniger als 1 Minute", () => {
    expect(formatDistanceToNow("2026-03-04T11:59:30Z")).toBe("gerade eben");
  });

  it("zeigt Minuten fuer weniger als 1 Stunde", () => {
    expect(formatDistanceToNow("2026-03-04T11:30:00Z")).toBe("vor 30 Min");
  });

  it("zeigt Stunden fuer weniger als 1 Tag", () => {
    expect(formatDistanceToNow("2026-03-04T09:00:00Z")).toBe("vor 3 Std");
  });

  it("zeigt Tage fuer weniger als 1 Woche", () => {
    expect(formatDistanceToNow("2026-03-01T12:00:00Z")).toBe("vor 3 Tagen");
  });

  it("faellt zurueck auf formatDateTime bei mehr als 7 Tagen", () => {
    const result = formatDistanceToNow("2026-02-20T12:00:00Z");
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});
