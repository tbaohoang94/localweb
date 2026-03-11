import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { createClient } from "@/lib/supabase-server";

describe("GET /api/health — Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("behandelt sehr langsame Supabase-Antwort (Latenz-Messung)", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: [{ id: "1" }], error: null }), 50),
          ),
      ),
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const response = await GET();
    const body = await response.json();

    expect(body.checks[0].latency_ms).toBeGreaterThanOrEqual(40);
  });

  it("gibt korrekten Timestamp im ISO-Format zurueck", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const response = await GET();
    const body = await response.json();

    // ISO 8601 Format pruefen
    const date = new Date(body.timestamp);
    expect(date.toISOString()).toBe(body.timestamp);
  });

  it("gibt genau 2 Checks zurueck", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const response = await GET();
    const body = await response.json();

    expect(body.checks).toHaveLength(2);
    expect(body.checks.map((c: { name: string }) => c.name)).toEqual([
      "supabase",
      "env_vars",
    ]);
  });

  it("setzt Content-Type auf application/json", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const response = await GET();
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
