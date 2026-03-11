/**
 * n8n Webhook Flood Test
 *
 * Simuliert hohe Last auf n8n Webhook-Endpoints.
 *
 * Ausfuehrung:
 *   npx tsx tests/load/n8n-webhook-flood.ts --scenario normal
 *   npx tsx tests/load/n8n-webhook-flood.ts --scenario burst
 *   npx tsx tests/load/n8n-webhook-flood.ts --scenario sustained
 *
 * Voraussetzungen:
 *   - n8n Docker laeuft
 *   - Webhook-Trigger in Workflows aktiviert
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "http://localhost:5678";

interface FloodResult {
  total: number;
  successful: number;
  failed: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  durationMs: number;
}

async function sendWebhook(
  path: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${N8N_BASE_URL}/webhook/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Szenarien ---

async function normalScenario(webhookPath: string): Promise<FloodResult> {
  console.log("Szenario: Normal (10 Events/Sekunde, 30 Sekunden)");
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;
  const start = Date.now();

  for (let i = 0; i < 300; i++) {
    const result = await sendWebhook(webhookPath, {
      test: true,
      index: i,
      scenario: "normal",
    });
    latencies.push(result.latencyMs);
    if (result.ok) successful++;
    else failed++;

    if (i % 10 === 9) await sleep(1000); // 10 pro Sekunde
    if (i % 50 === 49) process.stdout.write(`  ${i + 1}/300\r`);
  }

  return {
    total: 300,
    successful,
    failed,
    avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    maxLatencyMs: Math.max(...latencies),
    minLatencyMs: Math.min(...latencies),
    durationMs: Date.now() - start,
  };
}

async function burstScenario(webhookPath: string): Promise<FloodResult> {
  console.log("Szenario: Burst (100 Events gleichzeitig)");
  const start = Date.now();

  const promises = Array.from({ length: 100 }, (_, i) =>
    sendWebhook(webhookPath, { test: true, index: i, scenario: "burst" }),
  );

  const results = await Promise.all(promises);
  const latencies = results.map((r) => r.latencyMs);

  return {
    total: 100,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    maxLatencyMs: Math.max(...latencies),
    minLatencyMs: Math.min(...latencies),
    durationMs: Date.now() - start,
  };
}

async function sustainedScenario(webhookPath: string): Promise<FloodResult> {
  console.log("Szenario: Sustained (500 Events ueber 5 Minuten)");
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;
  const start = Date.now();
  const intervalMs = (5 * 60 * 1000) / 500; // ~600ms zwischen Events

  for (let i = 0; i < 500; i++) {
    const result = await sendWebhook(webhookPath, {
      test: true,
      index: i,
      scenario: "sustained",
    });
    latencies.push(result.latencyMs);
    if (result.ok) successful++;
    else failed++;

    await sleep(Math.max(0, intervalMs - result.latencyMs));
    if (i % 50 === 49) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      process.stdout.write(`  ${i + 1}/500 (${elapsed}s)\r`);
    }
  }

  return {
    total: 500,
    successful,
    failed,
    avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    maxLatencyMs: Math.max(...latencies),
    minLatencyMs: Math.min(...latencies),
    durationMs: Date.now() - start,
  };
}

// --- Runner ---

async function main() {
  const args = process.argv.slice(2);
  const scenarioIdx = args.indexOf("--scenario");
  const scenario = scenarioIdx !== -1 ? args[scenarioIdx + 1] : "normal";
  const webhookPath = args.includes("--path") ? args[args.indexOf("--path") + 1]! : "test-wf03";

  console.log("=== n8n Webhook Flood Test ===");
  console.log(`  Webhook: ${N8N_BASE_URL}/webhook/${webhookPath}`);
  console.log("");

  // n8n erreichbar?
  try {
    const res = await fetch(`${N8N_BASE_URL}/healthz`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    console.error(`FEHLER: n8n nicht erreichbar unter ${N8N_BASE_URL}`);
    process.exit(1);
  }

  let result: FloodResult;

  switch (scenario) {
    case "burst":
      result = await burstScenario(webhookPath);
      break;
    case "sustained":
      result = await sustainedScenario(webhookPath);
      break;
    default:
      result = await normalScenario(webhookPath);
  }

  console.log("\n");
  console.log("=== Ergebnis ===");
  console.log(`  Total:       ${result.total}`);
  console.log(`  Erfolgreich: ${result.successful}`);
  console.log(`  Fehlgeschl.: ${result.failed}`);
  console.log(`  Verlustrate: ${((result.failed / result.total) * 100).toFixed(1)}%`);
  console.log(`  Avg Latenz:  ${result.avgLatencyMs.toFixed(0)}ms`);
  console.log(`  Min Latenz:  ${result.minLatencyMs.toFixed(0)}ms`);
  console.log(`  Max Latenz:  ${result.maxLatencyMs.toFixed(0)}ms`);
  console.log(`  Dauer:       ${(result.durationMs / 1000).toFixed(1)}s`);
}

main();
