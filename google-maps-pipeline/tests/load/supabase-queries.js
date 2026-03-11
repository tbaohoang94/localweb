/**
 * k6 Load Test — Supabase Queries
 *
 * Testet direkte Supabase-Abfragen unter Last.
 *
 * Ausfuehrung:
 *   k6 run tests/load/supabase-queries.js \
 *     --env SUPABASE_URL=https://xxx.supabase.co \
 *     --env SUPABASE_KEY=eyJ...
 *
 * WICHTIG: Nur gegen Staging ausfuehren!
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("errors");
const readLatency = new Trend("read_latency", true);
const writeLatency = new Trend("write_latency", true);
const viewLatency = new Trend("view_latency", true);
const totalQueries = new Counter("total_queries");

const SUPABASE_URL = __ENV.SUPABASE_URL || "";
const SUPABASE_KEY = __ENV.SUPABASE_KEY || "";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export const options = {
  scenarios: {
    // Gleichzeitige Reads
    concurrent_reads: {
      executor: "constant-vus",
      vus: 30,
      duration: "3m",
      exec: "readQueries",
    },
    // Mixed Read/Write
    mixed_workload: {
      executor: "constant-vus",
      vus: 15,
      duration: "3m",
      exec: "mixedWorkload",
      startTime: "4m",
    },
    // View Queries (teure Aggregationen)
    view_queries: {
      executor: "constant-vus",
      vus: 10,
      duration: "2m",
      exec: "viewQueries",
      startTime: "8m",
    },
  },
  thresholds: {
    read_latency: ["p(95) < 300"],
    write_latency: ["p(95) < 500"],
    view_latency: ["p(95) < 1000"],
    errors: ["rate < 0.02"],
  },
};

export function readQueries() {
  // Locations abfragen
  const locRes = http.get(
    `${SUPABASE_URL}/rest/v1/locations?select=id,city,query,pipeline_stage&limit=50`,
    { headers },
  );
  readLatency.add(locRes.timings.duration);
  totalQueries.add(1);
  check(locRes, { "locations: status 200": (r) => r.status === 200 }) || errorRate.add(1);

  sleep(0.5);

  // Businesses abfragen (typische Dashboard-Query)
  const bizRes = http.get(
    `${SUPABASE_URL}/rest/v1/businesses?select=id,name,category,city,pipeline_stage&order=created_at.desc&limit=100`,
    { headers },
  );
  readLatency.add(bizRes.timings.duration);
  totalQueries.add(1);
  check(bizRes, { "businesses: status 200": (r) => r.status === 200 }) || errorRate.add(1);

  sleep(0.5);
}

export function mixedWorkload() {
  // Read
  const readRes = http.get(
    `${SUPABASE_URL}/rest/v1/businesses?select=id,name,pipeline_stage&limit=20`,
    { headers },
  );
  readLatency.add(readRes.timings.duration);
  totalQueries.add(1);

  sleep(0.3);

  // Write (system_logs — nicht-destruktiv)
  const writeRes = http.post(
    `${SUPABASE_URL}/rest/v1/system_logs`,
    JSON.stringify({
      source: "k6-load-test",
      severity: "info",
      workflow_name: "load-test",
      error_message: `Load test entry VU=${__VU} Iter=${__ITER}`,
    }),
    { headers: { ...headers, Prefer: "return=minimal" } },
  );
  writeLatency.add(writeRes.timings.duration);
  totalQueries.add(1);
  check(writeRes, { "write: status 201": (r) => r.status === 201 }) || errorRate.add(1);

  sleep(0.5);
}

export function viewQueries() {
  // Pipeline Errors View (Aggregation)
  const errRes = http.get(`${SUPABASE_URL}/rest/v1/pipeline_errors?limit=20`, { headers });
  viewLatency.add(errRes.timings.duration);
  totalQueries.add(1);
  check(errRes, { "pipeline_errors: status 200": (r) => r.status === 200 }) || errorRate.add(1);

  sleep(0.5);

  // System Logs Summary (Aggregation)
  const sumRes = http.get(`${SUPABASE_URL}/rest/v1/system_logs_summary?limit=10`, { headers });
  viewLatency.add(sumRes.timings.duration);
  totalQueries.add(1);
  check(sumRes, { "summary: status 200": (r) => r.status === 200 }) || errorRate.add(1);

  sleep(1);
}

export function teardown() {
  // Load-Test Logs bereinigen
  http.request(
    "DELETE",
    `${SUPABASE_URL}/rest/v1/system_logs?source=eq.k6-load-test`,
    null,
    { headers },
  );
}
