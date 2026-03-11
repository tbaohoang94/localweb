/**
 * k6 Load Test — Next.js API & Dashboard Routes
 *
 * Ausfuehrung:
 *   k6 run tests/load/api-routes.js
 *   k6 run tests/load/api-routes.js --env BASE_URL=https://staging.example.com
 *
 * Voraussetzungen:
 *   - k6 installiert (brew install k6)
 *   - Staging-Frontend laeuft
 *   - NIEMALS gegen Production ausfuehren!
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom Metrics
const errorRate = new Rate("errors");
const healthLatency = new Trend("health_latency", true);
const dashboardLatency = new Trend("dashboard_latency", true);

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    // Szenario 1: Normaler Betrieb (20 gleichzeitige User)
    normal_load: {
      executor: "constant-vus",
      vus: 20,
      duration: "5m",
      exec: "normalUsage",
      startTime: "0s",
    },
    // Szenario 2: Spitzenlast (bis 100 User)
    peak_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "5m", target: 50 },
        { duration: "2m", target: 100 },
        { duration: "5m", target: 100 },
        { duration: "2m", target: 0 },
      ],
      exec: "peakUsage",
      startTime: "6m",
    },
    // Szenario 3: Stress (weit ueber Kapazitaet)
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 200 },
        { duration: "5m", target: 200 },
        { duration: "1m", target: 0 },
      ],
      exec: "stressUsage",
      startTime: "22m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95) < 500"],
    http_req_failed: ["rate < 0.01"],
    errors: ["rate < 0.05"],
  },
};

// --- Test-Funktionen ---

export function normalUsage() {
  // Health Check (Baseline)
  const healthRes = http.get(`${BASE_URL}/api/health`);
  healthLatency.add(healthRes.timings.duration);
  check(healthRes, {
    "health: status 200": (r) => r.status === 200,
    "health: body has status": (r) => {
      try {
        return JSON.parse(r.body).status === "healthy";
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Dashboard Hauptseite
  const dashRes = http.get(`${BASE_URL}/dashboard`);
  dashboardLatency.add(dashRes.timings.duration);
  check(dashRes, {
    "dashboard: status 200 oder 302": (r) => r.status === 200 || r.status === 302,
  }) || errorRate.add(1);

  sleep(2);
}

export function peakUsage() {
  // Mehrere Dashboard-Seiten simulieren
  const pages = ["/dashboard", "/dashboard/businesses", "/dashboard/locations", "/dashboard/ops"];
  const page = pages[Math.floor(Math.random() * pages.length)];

  const res = http.get(`${BASE_URL}${page}`);
  check(res, {
    "page: status 200 oder 302": (r) => r.status === 200 || r.status === 302,
    "page: kein Server Error": (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(Math.random() * 3 + 1);
}

export function stressUsage() {
  // Schnelle Anfragen ohne Pause
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    "stress: kein 5xx": (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(0.1);
}
