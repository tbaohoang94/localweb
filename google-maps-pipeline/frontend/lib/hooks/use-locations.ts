/**
 * Daten-Hook fuer Locations.
 * Kapselt Supabase-Queries und Mutationen fuer die Locations-Tabelle.
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

export type LocationRow = {
  id: string;
  country: string;
  city: string;
  query: string;
  created_at: string | null;
  pipeline_stage: string;
};

export function useLocations() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    const supabase = createClient();
    setError(null);

    const { data, error: queryError } = await supabase
      .from("locations")
      .select("id, country, city, query, created_at, pipeline_stage")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setLocations(data ?? []);
    setLoading(false);
  }, []);

  const deleteMany = useCallback(
    async (ids: string[]) => {
      const supabase = createClient();
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        await supabase.from("locations").delete().in("id", batch);
      }
      await fetchLocations();
    },
    [fetchLocations],
  );

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, error, refetch: fetchLocations, deleteMany };
}
