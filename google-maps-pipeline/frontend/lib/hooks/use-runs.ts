/**
 * Daten-Hook fuer Scrape Runs.
 * Laedt Locations die nicht im Status "new" sind (= aktive/abgeschlossene Runs).
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { LocationStage } from "@/lib/pipeline-stages";

export type RunRow = {
  id: string;
  city: string;
  country: string;
  query: string;
  apify_run_id: string | null;
  pipeline_stage: string;
  scraped_at: string | null;
  scrape_finished_at: string | null;
  scrape_total_results: number | null;
};

export function useRuns(statusFilter: string) {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRuns() {
      const supabase = createClient();
      setError(null);

      let q = supabase
        .from("locations")
        .select(
          "id, city, country, query, apify_run_id, pipeline_stage, scraped_at, scrape_finished_at, scrape_total_results",
        )
        .neq("pipeline_stage", "new")
        .order("scraped_at", { ascending: false, nullsFirst: false });

      if (statusFilter) q = q.eq("pipeline_stage", statusFilter as LocationStage);

      const { data, error: queryError } = await q;

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setRuns(data ?? []);
      setLoading(false);
    }

    fetchRuns();
  }, [statusFilter]);

  return { runs, loading, error };
}
