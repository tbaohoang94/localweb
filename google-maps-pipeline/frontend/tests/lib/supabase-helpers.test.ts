import { describe, it, expect, vi, beforeEach } from "vitest";
import { batchInsert } from "@/lib/supabase-helpers";
import { createClient } from "@/lib/supabase-browser";

// Typen fuer den Mock
type MockInsertFn = ReturnType<typeof vi.fn>;

describe("batchInsert", () => {
  let mockInsert: MockInsertFn;

  beforeEach(() => {
    mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    vi.mocked(createClient).mockReturnValue({ from: mockFrom } as never);
  });

  it("fuegt kleine Batches in einem Insert ein", async () => {
    const rows = [{ name: "A" }, { name: "B" }];
    const result = await batchInsert("cities" as never, rows as never);
    expect(result).toEqual({ ok: 2, failed: 0 });
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("teilt grosse Datenmengen in Batches", async () => {
    const rows = Array.from({ length: 120 }, (_, i) => ({ name: `Item ${i}` }));
    const result = await batchInsert("cities" as never, rows as never, 50);
    expect(result).toEqual({ ok: 120, failed: 0 });
    expect(mockInsert).toHaveBeenCalledTimes(3); // 50 + 50 + 20
  });

  it("faellt auf Einzel-Inserts zurueck bei Batch-Fehler", async () => {
    // Erster Batch-Insert schlaegt fehl, Einzel-Inserts funktionieren
    mockInsert
      .mockResolvedValueOnce({ error: { message: "conflict" } }) // Batch fehlschlag
      .mockResolvedValue({ error: null }); // Einzel-Inserts OK

    const rows = [{ name: "A" }, { name: "B" }];
    const result = await batchInsert("cities" as never, rows as never);
    expect(result).toEqual({ ok: 2, failed: 0 });
    expect(mockInsert).toHaveBeenCalledTimes(3); // 1 Batch + 2 Einzel
  });

  it("zaehlt fehlgeschlagene Einzel-Inserts", async () => {
    mockInsert
      .mockResolvedValueOnce({ error: { message: "conflict" } }) // Batch fehlschlag
      .mockResolvedValueOnce({ error: null }) // Row 1 OK
      .mockResolvedValueOnce({ error: { message: "duplicate" } }); // Row 2 Fehler

    const rows = [{ name: "A" }, { name: "B" }];
    const result = await batchInsert("cities" as never, rows as never);
    expect(result).toEqual({ ok: 1, failed: 1 });
  });

  it("behandelt leeres Array korrekt", async () => {
    const result = await batchInsert("cities" as never, [] as never);
    expect(result).toEqual({ ok: 0, failed: 0 });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
