"use client";

import { useState } from "react";
import { useBusinesses } from "@/lib/hooks/use-businesses";

export default function BusinessesTable() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { businesses, loading, error } = useBusinesses(search, cityFilter, categoryFilter);

  if (loading) return <p className="text-muted-foreground">Laden...</p>;
  if (error) return <p className="text-red-600">Fehler: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          placeholder="Name suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
        />
        <input
          placeholder="Stadt filtern..."
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40"
        />
        <input
          placeholder="Kategorie filtern..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-40"
        />
        <span className="text-sm text-muted-foreground self-center">
          {businesses.length} Ergebnisse
        </span>
      </div>

      {businesses.length === 0 ? (
        <p className="text-muted-foreground">Keine Businesses gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Kategorie</th>
                <th className="pb-3 pr-4">Stadt</th>
                <th className="pb-3 pr-4">Telefon</th>
                <th className="pb-3 pr-4">Webseite</th>
                <th className="pb-3 pr-4 text-right">Bewertung</th>
                <th className="pb-3 pr-4 text-right">Anzahl</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz) => (
                <tr key={biz.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{biz.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{biz.category || "\u2014"}</td>
                  <td className="py-3 pr-4">{biz.city || "\u2014"}</td>
                  <td className="py-3 pr-4">{biz.phone || "\u2014"}</td>
                  <td className="py-3 pr-4">
                    {biz.website ? (
                      <a
                        href={biz.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block max-w-[200px]"
                      >
                        {biz.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "\u2014"
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right">{biz.rating ?? "\u2014"}</td>
                  <td className="py-3 pr-4 text-right">{biz.reviews_count ?? "\u2014"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
