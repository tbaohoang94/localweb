/**
 * Daten-Hook fuer Businesses.
 * Kapselt Supabase-Queries mit Debounce fuer Filter-Inputs.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export type BusinessRow = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
};

export function useBusinesses(search: string, city: string, category: string) {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusinesses() {
      const supabase = createClient();
      setError(null);

      let q = supabase
        .from("businesses")
        .select("id, name, category, city, phone, website, rating, reviews_count")
        .order("created_at", { ascending: false })
        .limit(100);

      if (search) q = q.ilike("name", `%${search}%`);
      if (city) q = q.eq("city", city);
      if (category) q = q.ilike("category", `%${category}%`);

      const { data, error: queryError } = await q;

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setBusinesses(data ?? []);
      setLoading(false);
    }

    const timeout = setTimeout(fetchBusinesses, 300);
    return () => clearTimeout(timeout);
  }, [search, city, category]);

  return { businesses, loading, error };
}
