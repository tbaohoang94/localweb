import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { createClient } from "@/lib/supabase-server";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("gibt 200 mit status=healthy wenn alles OK", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks).toHaveLength(2);
    expect(body.checks[0].name).toBe("supabase");
    expect(body.checks[0].status).toBe("ok");
    expect(body.checks[1].name).toBe("env_vars");
    expect(body.checks[1].status).toBe("ok");
    expect(body.total_latency_ms).toBeGreaterThanOrEqual(0);
    expect(body.timestamp).toBeTruthy();
  });

  it("gibt 503 mit status=unhealthy bei Supabase-Fehler", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "connection refused" } }),
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks[0].status).toBe("error");
    expect(body.checks[0].error).toBe("connection refused");
  });

  it("gibt 503 bei fehlenden Environment Variables", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    const envCheck = body.checks.find((c: { name: string }) => c.name === "env_vars");
    expect(envCheck.status).toBe("error");
    expect(envCheck.error).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("faengt Exceptions beim Supabase-Aufruf ab", async () => {
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        throw new Error("network timeout");
      }),
    } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks[0].error).toBe("network timeout");
  });

  it("misst Latenz korrekt", async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as never);

    const response = await GET();
    const body = await response.json();

    expect(body.checks[0].latency_ms).toBeGreaterThanOrEqual(0);
    expect(body.total_latency_ms).toBeGreaterThanOrEqual(0);
  });
});
