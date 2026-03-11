"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import AddLocationForm from "./add-location-form";
import CsvImportModal from "./csv-import-modal";

type Location = {
  id: string;
  country: string;
  city: string;
  query: string;
  created_at: string;
  scrape_status: string | null;
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "not scraped": "bg-gray-100 text-gray-600",
    running: "bg-yellow-100 text-yellow-800",
    finished: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

export default function LocationsTable() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const fetchLocations = useCallback(async () => {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setLocations(data as Location[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Derive unique keywords for filter dropdown
  const keywords = [...new Set(locations.map((l) => l.query))].sort();

  // Filter locations
  const filtered = locations.filter((loc) => {
    if (keywordFilter && loc.query !== keywordFilter) return false;
    if (statusFilter && (loc.scrape_status || "not scraped") !== statusFilter) return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setDeleting(true);

    const ids = [...selected];
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      await supabase.from("locations").delete().in("id", batch);
    }

    setSelected(new Set());
    setDeleting(false);
    fetchLocations();
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <AddLocationForm onAdded={fetchLocations} />
        <button
          onClick={() => setShowCsvModal(true)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 whitespace-nowrap"
        >
          Import CSV
        </button>
      </div>

      {showCsvModal && (
        <CsvImportModal
          onClose={() => setShowCsvModal(false)}
          onImported={fetchLocations}
        />
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={keywordFilter}
          onChange={(e) => setKeywordFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All keywords</option>
          {keywords.map((kw) => (
            <option key={kw} value={kw}>
              {kw}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="not scraped">Not scraped</option>
          <option value="running">Running</option>
          <option value="finished">Finished</option>
          <option value="failed">Failed</option>
        </select>
        <span className="text-sm text-gray-400">{filtered.length} locations</span>

        {selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : `Delete ${selected.size} selected`}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No locations found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-2">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="pb-3 pr-4">Country</th>
                <th className="pb-3 pr-4">City</th>
                <th className="pb-3 pr-4">Keyword</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loc) => (
                <tr key={loc.id} className="border-b last:border-0">
                  <td className="py-3 pr-2">
                    <input
                      type="checkbox"
                      checked={selected.has(loc.id)}
                      onChange={() => toggleSelect(loc.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="py-3 pr-4">{loc.country}</td>
                  <td className="py-3 pr-4">{loc.city}</td>
                  <td className="py-3 pr-4">{loc.query}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={loc.scrape_status || "not scraped"} />
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {new Date(loc.created_at).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
