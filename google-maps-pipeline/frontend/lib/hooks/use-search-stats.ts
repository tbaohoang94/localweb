/**
 * Daten-Hook fuer Suchbegriff-Statistiken.
 * Nutzt die search_query_stats View (serverseitige Aggregation).
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export type KeywordStats = {
  keyword: string;
  total: number;
  qualified: number;
  withWebsite: number;
  withContact: number;
  conversionRate: number;
  exported: number;
  progress: number;
};

type ViewRow = {
  search_string: string;
  total: number;
  qualified: number;
  with_website: number;
  with_contact: number;
  exported: number;
  terminal: number;
};

export function useSearchStats() {
  const [stats, setStats] = useState<KeywordStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      setError(null);

      const { data, error: queryError } = await supabase
        .from("search_query_stats")
        .select("search_string, total, qualified, with_website, with_contact, exported, terminal");

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const result: KeywordStats[] = (data as ViewRow[]).map((row) => {
        const conversionRate =
          row.with_website > 0 ? (row.with_contact / row.with_website) * 100 : 0;
        const progress = row.total > 0 ? (row.terminal / row.total) * 100 : 100;
        return {
          keyword: row.search_string,
          total: row.total,
          qualified: row.qualified,
          withWebsite: row.with_website,
          withContact: row.with_contact,
          conversionRate,
          exported: row.exported,
          progress,
        };
      });

      setStats(result);
      setLoading(false);
    }

    fetch();
  }, []);

  return { stats, loading, error };
}
