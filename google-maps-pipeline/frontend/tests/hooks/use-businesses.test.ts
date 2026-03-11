import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useBusinesses } from "@/lib/hooks/use-businesses";
import { createClient } from "@/lib/supabase-browser";

describe("useBusinesses", () => {
  let mockLimit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const mockData = {
      data: [
        {
          id: "1",
          name: "Test GmbH",
          category: "Geigenbauer",
          city: "Passau",
          phone: "+49 851 12345",
          website: "https://test.de",
          rating: 4.5,
          reviews_count: 42,
        },
      ],
      error: null,
    };

    mockLimit = vi.fn().mockResolvedValue(mockData);

    const queryBuilder: Record<string, unknown> = {};
    queryBuilder.select = vi.fn().mockReturnValue(queryBuilder);
    queryBuilder.order = vi.fn().mockReturnValue(queryBuilder);
    queryBuilder.limit = mockLimit;
    queryBuilder.ilike = vi.fn().mockReturnValue(queryBuilder);
    queryBuilder.eq = vi.fn().mockReturnValue(queryBuilder);

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue(queryBuilder),
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("laedt Businesses nach Debounce", async () => {
    const { result } = renderHook(() => useBusinesses("", "", ""));

    // Debounce von 300ms ausfuehren
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.businesses).toHaveLength(1);
    expect(result.current.businesses[0]!.name).toBe("Test GmbH");
  });

  it("setzt Error bei Supabase-Fehler", async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: "timeout" },
    });

    const { result } = renderHook(() => useBusinesses("", "", ""));

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("timeout");
  });

  it("behandelt leere Response korrekt", async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => useBusinesses("", "", ""));

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.businesses).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
