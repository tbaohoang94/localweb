import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// --- Environment Variables ---
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// --- Supabase Client Mock ---

/** Erstellt einen chainable Supabase Query Builder Mock */
function createQueryBuilderMock() {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainable = [
    "select",
    "insert",
    "update",
    "upsert",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "in",
    "is",
    "not",
    "or",
    "and",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
    "filter",
  ] as const;

  const builder: Record<string, unknown> = {};

  for (const method of chainable) {
    mock[method] = vi.fn().mockReturnValue(builder);
    builder[method] = mock[method];
  }

  // Terminale Methoden geben Promise zurueck
  mock["then"] = vi.fn();

  // Default: leere Daten, kein Fehler
  Object.assign(builder, {
    then: (resolve: (value: { data: null; error: null; count: null }) => void) =>
      resolve({ data: null, error: null, count: null }),
  });

  return { builder, mock };
}

const { builder: defaultQueryBuilder } = createQueryBuilderMock();

const supabaseMock = {
  from: vi.fn().mockReturnValue(defaultQueryBuilder),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock("@/lib/supabase-browser", () => ({
  createClient: vi.fn(() => supabaseMock),
}));

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() => supabaseMock),
}));

// --- Next.js Mocks ---

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/dashboard"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  })),
}));

// --- Exports fuer Tests ---
export { supabaseMock, createQueryBuilderMock };
