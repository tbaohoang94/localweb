"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { batchInsert } from "@/lib/supabase-helpers";

export default function AddLocationForm({ onAdded }: { onAdded: () => void }) {
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

    // Alle Staedte laden
    const { data: cities, error: citiesErr } = await supabase
      .from("cities")
      .select("city, country");

    if (citiesErr || !cities || cities.length === 0) {
      setError(citiesErr?.message || "Keine Staedte gefunden");
      setLoading(false);
      return;
    }

    // Eine Location-Zeile pro Stadt × Keyword (nur Staedte mit gueltigem Namen)
    const rows = cities
      .filter((c): c is { city: string; country: string } => Boolean(c.city && c.country))
      .map((c) => ({
        country: c.country,
        city: c.city,
        query: query.trim(),
      }));

    const { ok, failed } = await batchInsert("locations", rows);

    setResult(
      `${ok} Locations erstellt${failed > 0 ? `, ${failed} uebersprungen (Duplikate)` : ""}`,
    );
    setQuery("");
    onAdded();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Keyword</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          placeholder="z.B. Klempner"
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Wird hinzugefuegt..." : "Zu allen Staedten hinzufuegen"}
      </button>
      {error && <p className="text-red-600 text-xs self-center">{error}</p>}
      {result && <p className="text-green-700 text-xs self-center">{result}</p>}
    </form>
  );
}
