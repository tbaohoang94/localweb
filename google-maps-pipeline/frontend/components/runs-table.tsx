"use client";

import { useState } from "react";
import { useRuns } from "@/lib/hooks/use-runs";
import { LOCATION_STAGES } from "@/lib/pipeline-stages";
import { formatDateTime } from "@/lib/format";
import StatusBadge from "./status-badge";

// Nur Stages die fuer Runs relevant sind (nicht "new")
const RUN_FILTER_STAGES = LOCATION_STAGES.filter((s) => s.key !== "new");

export default function RunsTable() {
  const [statusFilter, setStatusFilter] = useState("");
  const { runs, loading, error } = useRuns(statusFilter);

  if (loading) return <p className="text-muted-foreground">Laden...</p>;
  if (error) return <p className="text-red-600">Fehler: {error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Alle Status</option>
          {RUN_FILTER_STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{runs.length} Runs</span>
      </div>

      {runs.length === 0 ? (
        <p className="text-muted-foreground">Keine Scrape-Runs gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4">Location</th>
                <th className="pb-3 pr-4">Suchbegriff</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Apify Run ID</th>
                <th className="pb-3 pr-4">Gestartet</th>
                <th className="pb-3 pr-4">Fertig</th>
                <th className="pb-3 pr-4 text-right">Ergebnisse</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    {run.city}, {run.country}
                  </td>
                  <td className="py-3 pr-4">{run.query}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={run.pipeline_stage} />
                  </td>
                  <td className="py-3 pr-4">
                    {run.apify_run_id ? (
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {run.apify_run_id}
                      </code>
                    ) : (
                      "\u2014"
                    )}
                  </td>
                  <td className="py-3 pr-4">{formatDateTime(run.scraped_at)}</td>
                  <td className="py-3 pr-4">{formatDateTime(run.scrape_finished_at)}</td>
                  <td className="py-3 pr-4 text-right">{run.scrape_total_results ?? "\u2014"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
