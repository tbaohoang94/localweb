import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDateTime, formatDate, formatNumber, formatDistanceToNow } from "@/lib/format";

describe("formatDateTime — Edge Cases", () => {
  it("behandelt ungueltiges Datum", () => {
    const result = formatDateTime("not-a-date");
    // new Date("not-a-date") ergibt Invalid Date → toLocaleString gibt "Invalid Date"
    expect(result).toBeTruthy();
  });

  it("behandelt Unix Epoch (1970-01-01)", () => {
    const result = formatDateTime("1970-01-01T00:00:00Z");
    expect(result).toMatch(/01\.01\.1970/);
  });

  it("behandelt weit in der Zukunft (2099-12-31)", () => {
    // UTC-Datum wird in lokale Zeitzone konvertiert → kann 01.01.2100 sein
    const result = formatDateTime("2099-12-31T12:00:00Z");
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });

  it("behandelt ISO-String mit Millisekunden", () => {
    const result = formatDateTime("2026-03-04T14:30:00.123Z");
    expect(result).toMatch(/04\.03\.2026/);
  });

  it("behandelt Datum mit Zeitzone-Offset", () => {
    const result = formatDateTime("2026-03-04T14:30:00+02:00");
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});

describe("formatNumber — Edge Cases", () => {
  it("behandelt MAX_SAFE_INTEGER", () => {
    const result = formatNumber(Number.MAX_SAFE_INTEGER);
    expect(result).toBeTruthy();
  });

  it("behandelt Float mit vielen Dezimalstellen", () => {
    const result = formatNumber(3.141592653589793);
    expect(result).toBeTruthy();
  });

  it("behandelt NaN", () => {
    const result = formatNumber(NaN);
    expect(result).toBe("NaN");
  });

  it("behandelt Infinity", () => {
    const result = formatNumber(Infinity);
    expect(result).toBe("∞");
  });
});

describe("formatDistanceToNow — Edge Cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-04T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("behandelt Zukunfts-Datum (negatives Diff)", () => {
    // Datum in der Zukunft → diffMin ist negativ
    const result = formatDistanceToNow("2026-03-04T13:00:00Z");
    // Sollte nicht crashen
    expect(result).toBeTruthy();
  });

  it("behandelt exakt jetzt", () => {
    const result = formatDistanceToNow("2026-03-04T12:00:00Z");
    expect(result).toBe("gerade eben");
  });

  it("behandelt exakt 1 Minute", () => {
    const result = formatDistanceToNow("2026-03-04T11:59:00Z");
    expect(result).toBe("vor 1 Min");
  });

  it("behandelt exakt 1 Stunde", () => {
    const result = formatDistanceToNow("2026-03-04T11:00:00Z");
    expect(result).toBe("vor 1 Std");
  });

  it("behandelt exakt 1 Tag", () => {
    const result = formatDistanceToNow("2026-03-03T12:00:00Z");
    expect(result).toBe("vor 1 Tagen");
  });
});
