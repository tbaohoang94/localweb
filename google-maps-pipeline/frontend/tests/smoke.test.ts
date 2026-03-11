import { describe, it, expect } from "vitest";

describe("Test-Setup Smoke Test", () => {
  it("laedt korrekt", () => {
    expect(true).toBe(true);
  });

  it("hat Environment Variables", () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
  });
});
