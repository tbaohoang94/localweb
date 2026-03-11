import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface HealthCheck {
  name: string;
  status: "ok" | "error";
  latency_ms?: number;
  error?: string;
}

export async function GET() {
  const checks: HealthCheck[] = [];
  const start = Date.now();

  // 1. Supabase-Verbindung pruefen
  const supabaseStart = Date.now();
  try {
    const supabase = createClient();
    const { error } = await supabase.from("cities").select("id").limit(1);
    checks.push({
      name: "supabase",
      status: error ? "error" : "ok",
      latency_ms: Date.now() - supabaseStart,
      ...(error && { error: error.message }),
    });
  } catch (e) {
    checks.push({
      name: "supabase",
      status: "error",
      latency_ms: Date.now() - supabaseStart,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // 2. Environment Variables pruefen
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  checks.push({
    name: "env_vars",
    status: missingVars.length === 0 ? "ok" : "error",
    ...(missingVars.length > 0 && { error: `Missing: ${missingVars.join(", ")}` }),
  });

  // Gesamt-Status ermitteln
  const hasError = checks.some((c) => c.status === "error");
  const overallStatus = hasError ? "unhealthy" : "healthy";

  return NextResponse.json(
    {
      status: overallStatus,
      checks,
      total_latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    },
    { status: hasError ? 503 : 200 },
  );
}
