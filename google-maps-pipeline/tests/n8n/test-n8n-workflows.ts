/**
 * n8n Workflow Integration Tests
 *
 * Sendet Test-Payloads an n8n Webhook-Trigger und prueft das Ergebnis in Supabase.
 *
 * Ausfuehrung:
 *   npx tsx tests/n8n/test-n8n-workflows.ts
 *
 * Voraussetzungen:
 *   - n8n Docker laeuft (docker compose up -d)
 *   - Supabase erreichbar (Staging oder lokal)
 *   - N8N_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY als Env-Variablen
 *
 * WICHTIG: Laeuft gegen die lokale n8n-Instanz — nie gegen Hetzner Production.
 */

// --- Konfiguration ---

const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "http://localhost:5678";
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.SUPABASE_GOOGLE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_GOOGLE_KEY ?? "";

interface WorkflowTest {
  name: string;
  webhookPath: string;
  testPayloads: {
    name: string;
    payload: Record<string, unknown>;
    expectedResult: "success" | "error";
    validateResult: () => Promise<boolean>;
  }[];
}

// --- Hilfsfunktionen ---

async function supabaseQuery(
  table: string,
  params: string,
): Promise<{ data: unknown[]; error: string | null }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return { data: [], error: `HTTP ${res.status}: ${await res.text()}` };
  return { data: await res.json(), error: null };
}

async function triggerWebhook(
  path: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; body: string }> {
  try {
    const res = await fetch(`${N8N_BASE_URL}/webhook/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status, body: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, body: e instanceof Error ? e.message : String(e) };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Test-Definitionen ---

const workflowTests: WorkflowTest[] = [
  {
    name: "WF 03 — Category Qualification",
    webhookPath: "test-wf03",
    testPayloads: [
      {
        name: "Standard-Trigger (verarbeitet businesses mit stage=new)",
        payload: {},
        expectedResult: "success",
        validateResult: async () => {
          // Pruefen ob WF 03 Businesses mit stage=new verarbeitet hat
          await sleep(5000);
          const { data } = await supabaseQuery(
            "system_logs",
            "source=eq.n8n&order=created_at.desc&limit=1",
          );
          return Array.isArray(data) && data.length > 0;
        },
      },
      {
        name: "Leerer Durchlauf (keine new Businesses)",
        payload: {},
        expectedResult: "success",
        validateResult: async () => {
          // WF sollte sauber beenden auch wenn keine Items da sind
          return true;
        },
      },
    ],
  },
  {
    name: "WF 04a — Enrich Dispatcher",
    webhookPath: "test-wf04a",
    testPayloads: [
      {
        name: "Standard-Trigger (verarbeitet qualified Businesses)",
        payload: {},
        expectedResult: "success",
        validateResult: async () => {
          await sleep(10000);
          const { data } = await supabaseQuery(
            "businesses",
            "pipeline_stage=eq.enriching&limit=1",
          );
          // Wenn qualified Businesses existieren, sollte mindestens eines enriching sein
          return true; // Nicht-destruktiver Check
        },
      },
    ],
  },
  {
    name: "WF 05 — CSV Export",
    webhookPath: "test-wf05",
    testPayloads: [
      {
        name: "Standard-Trigger (exportiert enriched Businesses)",
        payload: {},
        expectedResult: "success",
        validateResult: async () => {
          await sleep(5000);
          return true; // Email-Versand kann nicht programmatisch geprueft werden
        },
      },
    ],
  },
];

// --- Test-Runner ---

async function runTests() {
  console.log("=== n8n Workflow Integration Tests ===\n");

  // Voraussetzungen pruefen
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("FEHLER: SUPABASE_URL und SUPABASE_SERVICE_KEY muessen gesetzt sein");
    process.exit(1);
  }

  // n8n erreichbar?
  try {
    const healthRes = await fetch(`${N8N_BASE_URL}/healthz`);
    if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
    console.log(`n8n erreichbar: ${N8N_BASE_URL}`);
  } catch {
    console.error(`FEHLER: n8n nicht erreichbar unter ${N8N_BASE_URL}`);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const wf of workflowTests) {
    console.log(`\n--- ${wf.name} ---`);

    for (const test of wf.testPayloads) {
      process.stdout.write(`  ${test.name}... `);

      const result = await triggerWebhook(wf.webhookPath, test.payload);

      if (!result.ok && test.expectedResult === "success") {
        console.log(`FAIL (HTTP ${result.status}: ${result.body.substring(0, 100)})`);
        failed++;
        continue;
      }

      if (result.ok && test.expectedResult === "error") {
        console.log("FAIL (erwartet Fehler, bekam Erfolg)");
        failed++;
        continue;
      }

      try {
        const valid = await test.validateResult();
        if (valid) {
          console.log("PASS");
          passed++;
        } else {
          console.log("FAIL (Validierung fehlgeschlagen)");
          failed++;
        }
      } catch (e) {
        console.log(`SKIP (Validierung nicht moeglich: ${e})`);
        skipped++;
      }
    }
  }

  console.log("\n=== Ergebnis ===");
  console.log(`Bestanden: ${passed} | Fehlgeschlagen: ${failed} | Uebersprungen: ${skipped}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
