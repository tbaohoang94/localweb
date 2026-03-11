"use client";

import { useState } from "react";
import { useLocations } from "@/lib/hooks/use-locations";
import { LOCATION_STAGES } from "@/lib/pipeline-stages";
import { formatDate } from "@/lib/format";
import StatusBadge from "./status-badge";
import AddLocationForm from "./add-location-form";
import CsvImportModal from "./csv-import-modal";

export default function LocationsTable() {
  const { locations, loading, error, refetch, deleteMany } = useLocations();
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const keywords = [...new Set(locations.map((l) => l.query))].sort();

  const filtered = locations.filter((loc) => {
    if (keywordFilter && loc.query !== keywordFilter) return false;
    if (statusFilter && loc.pipeline_stage !== statusFilter) return false;
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
    await deleteMany([...selected]);
    setSelected(new Set());
    setDeleting(false);
  }

  if (loading) return <p className="text-muted-foreground">Laden...</p>;
  if (error) return <p className="text-red-600">Fehler: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <AddLocationForm onAdded={refetch} />
        <button
          onClick={() => setShowCsvModal(true)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 whitespace-nowrap"
        >
          CSV importieren
        </button>
      </div>

      {showCsvModal && (
        <CsvImportModal onClose={() => setShowCsvModal(false)} onImported={refetch} />
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={keywordFilter}
          onChange={(e) => setKeywordFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Alle Keywords</option>
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
          <option value="">Alle Status</option>
          {LOCATION_STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} Locations</span>

        {selected.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Loesche..." : `${selected.size} ausgewaehlte loeschen`}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">Keine Locations gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-2">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="pb-3 pr-4">Land</th>
                <th className="pb-3 pr-4">Stadt</th>
                <th className="pb-3 pr-4">Keyword</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Erstellt</th>
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
                    <StatusBadge status={loc.pipeline_stage} />
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{formatDate(loc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
