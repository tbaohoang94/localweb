"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";

interface UseDashboardDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching dashboard data from Supabase.
 * Re-fetches when filters change (from/to/rep).
 */
export function useDashboardQuery<T>(
  queryFn: (supabase: SupabaseClient, filters: { from: string; to: string; rep: string }) => Promise<T>,
  filters: { from: string; to: string; rep: string }
): UseDashboardDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    queryFn(supabaseRef.current, {
      from: filters.from,
      to: filters.to,
      rep: filters.rep,
    })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.rep]);

  return { data, loading, error };
}
