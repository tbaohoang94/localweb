import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLocations } from "@/lib/hooks/use-locations";
import { createClient } from "@/lib/supabase-browser";

describe("useLocations", () => {
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let mockIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          country: "Deutschland",
          city: "Passau",
          query: "Geigenbauer",
          created_at: "2026-03-04T12:00:00Z",
          pipeline_stage: "new",
        },
      ],
      error: null,
    });
    mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    mockIn = vi.fn().mockResolvedValue({ error: null });
    mockDelete = vi.fn().mockReturnValue({ in: mockIn });

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      }),
    } as never);
  });

  it("laedt Locations beim Mount", async () => {
    const { result } = renderHook(() => useLocations());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.locations).toHaveLength(1);
    expect(result.current.locations[0]!.city).toBe("Passau");
    expect(result.current.error).toBeNull();
  });

  it("setzt Error bei Supabase-Fehler", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "relation does not exist" },
    });

    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("relation does not exist");
    expect(result.current.locations).toEqual([]);
  });

  it("behandelt leere Response korrekt", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.locations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("bietet refetch-Funktion", async () => {
    const { result } = renderHook(() => useLocations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refetch ausloesen
    await result.current.refetch();

    // Select wurde erneut aufgerufen
    expect(mockSelect).toHaveBeenCalledTimes(2);
  });
});
