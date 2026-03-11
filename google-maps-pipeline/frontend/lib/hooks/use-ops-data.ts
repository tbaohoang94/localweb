"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

export interface SystemLog {
  id: string;
  source: string;
  severity: string;
  workflow_name: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PipelineError {
  entity_type: string;
  id: string;
  city: string | null;
  name: string | null;
  stage: string;
  retry_count: number;
  last_error: string | null;
  updated_at: string | null;
}

export interface DlqItem {
  id: string;
  source_workflow: string;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  status: string;
  created_at: string;
}

export interface OpsData {
  systemLogs: SystemLog[];
  pipelineErrors: PipelineError[];
  dlqItems: DlqItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOpsData(): OpsData {
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [pipelineErrors, setPipelineErrors] = useState<PipelineError[]>([]);
  const [dlqItems, setDlqItems] = useState<DlqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const [logsResult, errorsResult, dlqResult] = await Promise.all([
      supabase
        .from("system_logs")
        .select("id, source, severity, workflow_name, error_message, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("pipeline_errors")
        .select("entity_type, id, city, name, stage, retry_count, last_error, updated_at"),
      supabase
        .from("dead_letter_queue")
        .select("id, source_workflow, error_message, retry_count, max_retries, status, created_at")
        .in("status", ["pending", "retrying"])
        .order("created_at", { ascending: false }),
    ]);

    if (logsResult.error) {
      setError(logsResult.error.message);
    } else {
      setSystemLogs((logsResult.data as SystemLog[]) || []);
    }

    if (!errorsResult.error) {
      setPipelineErrors((errorsResult.data as PipelineError[]) || []);
    }

    if (!dlqResult.error) {
      setDlqItems((dlqResult.data as DlqItem[]) || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { systemLogs, pipelineErrors, dlqItems, loading, error, refetch: fetchAll };
}
