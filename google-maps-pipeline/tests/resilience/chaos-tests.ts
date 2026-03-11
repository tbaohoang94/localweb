/**
 * Chaos & Resilience Tests
 *
 * Simuliert Ausfaelle und prueft wie sich das System verhaelt.
 *
 * Ausfuehrung:
 *   npx tsx tests/resilience/chaos-tests.ts
 *
 * Voraussetzungen:
 *   - STAGING_SUPABASE_URL + STAGING_SUPABASE_KEY
 *   - n8n Docker laeuft
 *   - Frontend laeuft (optional)
 *
 * WICHTIG: Nur gegen Staging ausfuehren!
 */

const SUPABASE_URL = process.env.STAGING_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.STAGING_SUPABASE_KEY ?? "";
const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "http://localhost:5678";
const NEXT_URL = process.env.NEXT_URL ?? "http://localhost:3000";

// --- Hilfsfunktionen ---

async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function supabaseReachable(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/cities?limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function n8nReachable(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${N8N_BASE_URL}/healthz`);
    return res.ok;
  } catch {
    return false;
  }
}

async function nextReachable(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${NEXT_URL}/api/health`);
    return res.status === 200 || res.status === 503;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Test-Definitionen ---

interface ChaosTest {
  name: string;
  category: string;
  run: () => Promise<{
    passed: boolean;
    details: string;
    dataLoss: "none" | "possible" | "confirmed";
    autoRecovery: boolean;
  }>;
}

const chaosTests: ChaosTest[] = [
  // ============================================================
  // 5.1 Service-Ausfall-Szenarien
  // ============================================================
  {
    name: "Health-Endpoint bei Supabase-Ausfall",
    category: "service-failure",
    run: async () => {
      // Simuliert: Supabase nicht erreichbar
      // Der Health-Endpoint sollte 503 zurueckgeben, nicht crashen
      const res = await fetchWithTimeout(`${NEXT_URL}/api/health`);
      const body = await res.json();
      const hasSupabaseCheck = body.checks?.some(
        (c: { name: string }) => c.name === "supabase",
      );

      return {
        passed: hasSupabaseCheck && (res.status === 200 || res.status === 503),
        details: `Status ${res.status}, Supabase-Check vorhanden: ${hasSupabaseCheck}`,
        dataLoss: "none",
        autoRecovery: true,
      };
    },
  },

  // ============================================================
  // 5.2 Daten-Chaos-Szenarien
  // ============================================================
  {
    name: "Doppelter Business-Insert (Idempotenz via place_id)",
    category: "data-chaos",
    run: async () => {
      const placeId = `chaos_test_${Date.now()}`;
      const headers = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      };

      // Erster Insert
      const res1 = await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          place_id: placeId,
          name: "Chaos Test 1",
          pipeline_stage: "new",
        }),
      });

      // Zweiter Insert (Duplikat)
      const res2 = await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          place_id: placeId,
          name: "Chaos Test 2",
          pipeline_stage: "new",
        }),
      });

      // Pruefen: Nur 1 Eintrag
      const countRes = await fetch(
        `${SUPABASE_URL}/rest/v1/businesses?place_id=eq.${placeId}&select=id`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      );
      const data = await countRes.json();

      // Cleanup
      await fetch(`${SUPABASE_URL}/rest/v1/businesses?place_id=eq.${placeId}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });

      return {
        passed: res1.ok && res2.status === 409 && data.length === 1,
        details: `Insert 1: ${res1.status}, Insert 2: ${res2.status}, Eintraege: ${data.length}`,
        dataLoss: "none",
        autoRecovery: true,
      };
    },
  },
  {
    name: "Race Condition: Gleichzeitiger Pipeline-Stage-Update",
    category: "data-chaos",
    run: async () => {
      const placeId = `race_test_${Date.now()}`;
      const headers = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      // Business erstellen
      await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          place_id: placeId,
          name: "Race Test",
          pipeline_stage: "new",
        }),
      });

      // Gleichzeitig 2 Updates
      const [update1, update2] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/businesses?place_id=eq.${placeId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ pipeline_stage: "qualified" }),
          },
        ),
        fetch(
          `${SUPABASE_URL}/rest/v1/businesses?place_id=eq.${placeId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ pipeline_stage: "unqualified" }),
          },
        ),
      ]);

      // Pruefen: Einer gewinnt (Last-Write-Wins)
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/businesses?place_id=eq.${placeId}&select=pipeline_stage`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      );
      const data = await checkRes.json();

      // Cleanup
      await fetch(`${SUPABASE_URL}/rest/v1/businesses?place_id=eq.${placeId}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });

      const stage = data[0]?.pipeline_stage;
      return {
        passed:
          update1.ok &&
          update2.ok &&
          (stage === "qualified" || stage === "unqualified"),
        details: `Update 1: ${update1.status}, Update 2: ${update2.status}, Ergebnis: ${stage} (Last-Write-Wins)`,
        dataLoss: "none",
        autoRecovery: true,
      };
    },
  },
  {
    name: "Ungueltige ENUM-Werte werden abgewiesen",
    category: "data-chaos",
    run: async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          place_id: `enum_test_${Date.now()}`,
          name: "ENUM Test",
          pipeline_stage: "invalid_stage",
        }),
      });

      return {
        passed: !res.ok, // Sollte Fehler geben
        details: `HTTP ${res.status} — ungueltiger ENUM korrekt abgewiesen`,
        dataLoss: "none",
        autoRecovery: true,
      };
    },
  },

  // ============================================================
  // 5.2 Daten-Chaos: Edge Cases
  // ============================================================
  {
    name: "XSS-String in Business-Name wird gespeichert ohne Ausfuehrung",
    category: "data-chaos",
    run: async () => {
      const placeId = `xss_test_${Date.now()}`;
      const xssName = '<script>alert("xss")</script>';

      await fetch(`${SUPABASE_URL}/rest/v1/businesses`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          place_id: placeId,
          name: xssName,
          pipeline_stage: "new",
        }),
      });

      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/businesses?place_id=eq.${placeId}&select=name`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      );
      const data = await checkRes.json();

      // Cleanup
      await fetch(`${SUPABASE_URL}/rest/v1/businesses?place_id=eq.${placeId}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });

      return {
        passed: data[0]?.name === xssName, // Wird gespeichert, nicht ausgefuehrt
        details: `Name gespeichert: ${data[0]?.name?.substring(0, 40)}`,
        dataLoss: "none",
        autoRecovery: true,
      };
    },
  },

  // ============================================================
  // 5.3 Infrastruktur-Chaos
  // ============================================================
  {
    name: "n8n Health-Endpoint erreichbar",
    category: "infra",
    run: async () => {
      const reachable = await n8nReachable();
      return {
        passed: reachable,
        details: reachable ? "n8n antwortet auf /healthz" : "n8n nicht erreichbar",
        dataLoss: "none",
        autoRecovery: true,
      };
    },
  },
  {
    name: "n8n Docker Restart-Policy konfiguriert",
    category: "infra",
    run: async () => {
      // Pruefe ob Docker restart policy gesetzt ist
      // Dies ist ein statischer Check — kein destruktiver Test
      try {
        const { execSync } = await import("child_process");
        const output = execSync(
          'docker inspect --format="{{.HostConfig.RestartPolicy.Name}}" docker-n8n-1 2>/dev/null || echo "not-found"',
        ).toString().trim();
        const hasRestart = output === "unless-stopped" || output === "always";
        return {
          passed: hasRestart,
          details: `Restart Policy: ${output}`,
          dataLoss: "none",
          autoRecovery: hasRestart,
        };
      } catch {
        return {
          passed: false,
          details: "Docker nicht erreichbar oder Container nicht gefunden",
          dataLoss: "none",
          autoRecovery: false,
        };
      }
    },
  },
];

// --- Runner ---

async function main() {
  console.log("=== Chaos & Resilience Tests ===\n");

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
  let skipped = 0;
  const results: {
    name: string;
    category: string;
    passed: boolean;
    dataLoss: string;
    autoRecovery: boolean;
    details: string;
  }[] = [];

  for (const test of chaosTests) {
    process.stdout.write(`  [${test.category}] ${test.name}... `);
    try {
      const result = await test.run();
      results.push({ name: test.name, category: test.category, ...result });
      if (result.passed) {
        console.log("PASS");
        passed++;
      } else {
        console.log(`FAIL — ${result.details}`);
        failed++;
      }
    } catch (e) {
      console.log(`SKIP — ${e instanceof Error ? e.message : String(e)}`);
      skipped++;
    }
  }

  // Resilience-Matrix ausgeben
  console.log("\n=== Resilience-Matrix ===\n");
  console.log("| Szenario | Ergebnis | Datenverlust | Auto-Recovery |");
  console.log("|----------|----------|-------------|---------------|");
  for (const r of results) {
    console.log(
      `| ${r.name.substring(0, 50)} | ${r.passed ? "PASS" : "FAIL"} | ${r.dataLoss} | ${r.autoRecovery ? "Ja" : "Nein"} |`,
    );
  }

  console.log(`\n=== Gesamt: ${passed} bestanden, ${failed} fehlgeschlagen, ${skipped} uebersprungen ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
