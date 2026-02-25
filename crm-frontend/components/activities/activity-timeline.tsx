"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Filter } from "lucide-react";

interface Activity {
  id: string;
  close_id: string;
  calculation: string | null;
  ergebnis: string | null;
  date: string | null;
  lead_id: string | null;
  owner_id: string | null;
  show_up_rate: number | null;
  leads?: { lead_name: string } | null;
}

export default function ActivityTimeline({
  initialActivities,
  initialCount,
}: {
  initialActivities: Activity[];
  initialCount: number;
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const fetchActivities = useCallback(
    async (resetPage = true) => {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const supabase = createClient();
      const offset = (currentPage - 1) * pageSize;

      let query = supabase
        .from("custom_activities")
        .select("*, leads(lead_name)", { count: "exact" })
        .order("date", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (dateFrom) {
        query = query.gte("date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("date", dateTo + "T23:59:59");
      }

      const { data, count } = await query;
      setActivities(data ?? []);
      setTotalCount(count ?? 0);
      setLoading(false);
    },
    [dateFrom, dateTo, page]
  );

  useEffect(() => {
    fetchActivities(true);
  }, [fetchActivities]);

  const loadPage = (p: number) => {
    setPage(p);
    setTimeout(() => fetchActivities(false), 0);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 ml-auto">
          <Filter size={14} className="text-gray-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-md"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">
            Loading...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            No activities found
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((act) => (
              <div
                key={act.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {act.calculation || "Activity"}
                      </span>
                      {act.show_up_rate != null && (
                        <span className="text-xs text-gray-400">
                          Show-up: {act.show_up_rate}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {act.ergebnis || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {act.leads?.lead_name && act.lead_id && (
                        <Link
                          href={`/dashboard/leads/${act.lead_id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {act.leads.lead_name}
                        </Link>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {act.date
                      ? new Date(act.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {totalCount} activit{totalCount !== 1 ? "ies" : "y"} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
