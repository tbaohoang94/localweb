"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type ScrapeLocation = {
  id: string;
  city: string;
  country: string;
  query: string;
  apify_run_id: string;
  scrape_status: string;
  scraped_at: string;
  scrape_finished_at: string | null;
  scrape_total_results: number | null;
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RunsTable() {
  const [runs, setRuns] = useState<ScrapeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchRuns() {
      let q = supabase
        .from("locations")
        .select("*")
        .not("scrape_status", "is", null)
        .order("scraped_at", { ascending: false });

      if (statusFilter) q = q.eq("scrape_status", statusFilter);

      const { data } = await q;
      if (data) setRuns(data as ScrapeLocation[]);
      setLoading(false);
    }

    fetchRuns();
  }, [statusFilter]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All statuses</option>
          <option value="running">Running</option>
          <option value="finished">Finished</option>
          <option value="failed">Failed</option>
        </select>
        <span className="text-sm text-gray-400">{runs.length} runs</span>
      </div>

      {runs.length === 0 ? (
        <p className="text-gray-500">No scrape runs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4">Location</th>
                <th className="pb-3 pr-4">Query</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Apify Run ID</th>
                <th className="pb-3 pr-4">Started</th>
                <th className="pb-3 pr-4">Finished</th>
                <th className="pb-3 pr-4 text-right">Results</th>
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
                    <StatusBadge status={run.scrape_status} />
                  </td>
                  <td className="py-3 pr-4">
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {run.apify_run_id}
                    </code>
                  </td>
                  <td className="py-3 pr-4">{formatDate(run.scraped_at)}</td>
                  <td className="py-3 pr-4">{formatDate(run.scrape_finished_at)}</td>
                  <td className="py-3 pr-4 text-right">
                    {run.scrape_total_results ?? "—"}
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
