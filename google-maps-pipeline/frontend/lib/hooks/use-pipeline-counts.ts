/**
 * Daten-Hook fuer Pipeline-Zaehler.
 * Nutzt die pipeline_counts View (1 Query statt 12 separate Count-Abfragen).
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export type StageCounts = Record<string, number>;

type CountRow = {
  source: string;
  pipeline_stage: string;
  count: number;
};

export function usePipelineCounts() {
  const [locations, setLocations] = useState<StageCounts>({});
  const [businesses, setBusinesses] = useState<StageCounts>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("pipeline_counts")
        .select("source, pipeline_stage, count");

      if (error) {
        setLoading(false);
        return;
      }

      const locCounts: StageCounts = {};
      const bizCounts: StageCounts = {};

      for (const row of data as CountRow[]) {
        if (row.source === "locations") {
          locCounts[row.pipeline_stage] = row.count;
        } else {
          bizCounts[row.pipeline_stage] = row.count;
        }
      }

      setLocations(locCounts);
      setBusinesses(bizCounts);
      setLoading(false);
    }

    fetchCounts();
  }, []);

  return { locations, businesses, loading };
}
