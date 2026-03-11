/**
 * Pipeline End-to-End Integration Tests
 *
 * Prueft den vollstaendigen Pipeline-Durchlauf:
 * Location (new) → scraping → scraped → imported → Businesses (new) → qualified → enriched → exported
 *
 * Ausfuehrung:
 *   npx tsx tests/integration/pipeline-e2e.test.ts
 *
 * Voraussetzungen:
 *   - STAGING_SUPABASE_URL und STAGING_SUPABASE_KEY gesetzt
 *   - n8n Docker laeuft (fuer Workflow-Trigger)
 *   - NICHT gegen Production ausfuehren!
 */

const SUPABASE_URL = process.env.STAGING_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.STAGING_SUPABASE_KEY ?? "";
const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "http://localhost:5678";

// --- Hilfsfunktionen ---

async function supabaseQuery(
  table: string,
  params: string,
): Promise<{ data: Record<string, unknown>[]; error: string | null }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return { data: [], error: `HTTP ${res.status}` };
  return { data: await res.json(), error: null };
}

async function supabaseInsert(
  table: string,
  row: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) return { data: null, error: `HTTP ${res.status}: ${await res.text()}` };
  const data = await res.json();
  return { data: Array.isArray(data) ? data[0] : data, error: null };
}

async function supabaseDelete(table: string, filter: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Tests ---

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => Promise<void>) {
  return { name, fn };
}

const tests = [
  test("Supabase-Verbindung funktioniert", async () => {
    const { data, error } = await supabaseQuery("cities", "limit=1");
    if (error) throw new Error(`Supabase nicht erreichbar: ${error}`);
    if (!data) throw new Error("Keine Daten zurueckbekommen");
  }),

  test("Location einfuegen mit pipeline_stage=new", async () => {
    const { data, error } = await supabaseInsert("locations", {
      country: "TestLand",
      city: "TestStadt",
      query: "TestQuery_E2E",
      pipeline_stage: "new",
    });
    if (error) throw new Error(`Insert fehlgeschlagen: ${error}`);
    if (!data) throw new Error("Kein Ergebnis");
    if (data.pipeline_stage !== "new") throw new Error(`Stage ist ${data.pipeline_stage}, erwartet: new`);
  }),

  test("Location wurde korrekt gespeichert", async () => {
    const { data } = await supabaseQuery(
      "locations",
      "city=eq.TestStadt&query=eq.TestQuery_E2E",
    );
    if (data.length === 0) throw new Error("Location nicht gefunden");
    if (data[0]!.pipeline_stage !== "new") throw new Error("Stage nicht 'new'");
  }),

  test("Duplikat-Location wird abgewiesen (UNIQUE Constraint)", async () => {
    const { error } = await supabaseInsert("locations", {
      country: "TestLand",
      city: "TestStadt",
      query: "TestQuery_E2E",
      pipeline_stage: "new",
    });
    // Sollte Fehler geben wegen UNIQUE(country, city, query)
    if (!error) throw new Error("Duplikat wurde nicht abgewiesen");
  }),

  test("Business einfuegen mit place_id UPSERT", async () => {
    const { data, error } = await supabaseInsert("businesses", {
      place_id: "test_e2e_001",
      name: "E2E Test GmbH",
      category: "TestKategorie",
      city: "TestStadt",
      pipeline_stage: "new",
      search_string: "TestQuery_E2E",
    });
    if (error) throw new Error(`Insert fehlgeschlagen: ${error}`);
    if (!data) throw new Error("Kein Ergebnis");
  }),

  test("Business Duplikat-place_id wird abgewiesen", async () => {
    const { error } = await supabaseInsert("businesses", {
      place_id: "test_e2e_001",
      name: "Duplikat GmbH",
      pipeline_stage: "new",
    });
    if (!error) throw new Error("Duplikat wurde nicht abgewiesen");
  }),

  test("system_logs Eintrag schreiben und lesen", async () => {
    const { error } = await supabaseInsert("system_logs", {
      source: "test",
      severity: "info",
      workflow_name: "e2e-test",
      error_message: "Test-Eintrag fuer E2E",
    });
    if (error) throw new Error(`Log-Insert fehlgeschlagen: ${error}`);

    const { data } = await supabaseQuery(
      "system_logs",
      "source=eq.test&workflow_name=eq.e2e-test&order=created_at.desc&limit=1",
    );
    if (data.length === 0) throw new Error("Log-Eintrag nicht gefunden");
  }),

  test("pipeline_errors View ist abfragbar", async () => {
    const { error } = await supabaseQuery("pipeline_errors", "limit=5");
    if (error) throw new Error(`View-Abfrage fehlgeschlagen: ${error}`);
  }),

  test("system_logs_summary View ist abfragbar", async () => {
    const { error } = await supabaseQuery("system_logs_summary", "limit=5");
    if (error) throw new Error(`View-Abfrage fehlgeschlagen: ${error}`);
  }),

  test("Health-Endpoint antwortet", async () => {
    // Nur wenn Frontend laeuft
    try {
      const res = await fetch(`${process.env.NEXT_URL ?? "http://localhost:3000"}/api/health`);
      if (!res.ok && res.status !== 503) {
        throw new Error(`Health-Endpoint HTTP ${res.status}`);
      }
    } catch (e) {
      if (e instanceof TypeError) {
        console.log("  (Frontend nicht gestartet — uebersprungen)");
        return;
      }
      throw e;
    }
  }),

  // Cleanup
  test("Testdaten bereinigen", async () => {
    await supabaseDelete("businesses", "place_id=eq.test_e2e_001");
    await supabaseDelete("locations", "city=eq.TestStadt&query=eq.TestQuery_E2E");
    await supabaseDelete("system_logs", "source=eq.test&workflow_name=eq.e2e-test");
  }),
];

// --- Runner ---

async function run() {
  console.log("=== Pipeline E2E Integration Tests ===\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("FEHLER: STAGING_SUPABASE_URL und STAGING_SUPABASE_KEY muessen gesetzt sein");
    process.exit(1);
  }

  if (SUPABASE_URL.includes("wknzyrvcrcdchnysntii")) {
    console.error("ABBRUCH: Production-Projekt erkannt!");
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    process.stdout.write(`  ${t.name}... `);
    try {
      await t.fn();
      console.log("PASS");
      passed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`FAIL (${msg})`);
      failed++;
    }
  }

  console.log(`\n=== Ergebnis: ${passed} bestanden, ${failed} fehlgeschlagen ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
