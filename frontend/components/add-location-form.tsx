"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function AddLocationForm({
  onAdded,
}: {
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult("");
    setLoading(true);

    // Fetch all cities
    const { data: cities, error: citiesErr } = await supabase
      .from("cities")
      .select("city, country");

    if (citiesErr || !cities || cities.length === 0) {
      setError(citiesErr?.message || "No cities found");
      setLoading(false);
      return;
    }

    // Create a location row for each city × keyword
    const rows = cities.map((c) => ({
      country: c.country,
      city: c.city,
      query: query.trim(),
    }));

    let ok = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error: batchErr } = await supabase.from("locations").insert(batch);
      if (batchErr) {
        // Batch failed (likely duplicates) — try one by one
        for (const row of batch) {
          const { error: rowErr } = await supabase.from("locations").insert(row);
          if (rowErr) failed++;
          else ok++;
        }
      } else {
        ok += batch.length;
      }
    }

    setResult(`${ok} locations created${failed > 0 ? `, ${failed} skipped (duplicates)` : ""}`);
    setQuery("");
    onAdded();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Keyword</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          placeholder="e.g. Plumber"
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add to all cities"}
      </button>
      {error && <p className="text-red-600 text-xs self-center">{error}</p>}
      {result && <p className="text-green-700 text-xs self-center">{result}</p>}
    </form>
  );
}
