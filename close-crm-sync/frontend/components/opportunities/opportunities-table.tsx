"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Opportunity {
  id: string;
  close_id: string;
  status: string;
  value: number;
  confidence: number | null;
  date_created: string;
  close_url: string | null;
  leads?: { lead_name: string } | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  won: "bg-blue-50 text-blue-700",
  lost: "bg-red-50 text-red-700",
};

const statusOptions = ["all", "active", "won", "lost"];

export default function OpportunitiesTable({
  opportunities,
  totalCount,
  page,
  status,
}: {
  opportunities: Opportunity[];
  totalCount: number;
  page: number;
  status: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSize = 25;
  const totalPages = Math.ceil(totalCount / pageSize);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/dashboard/opportunities?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`/dashboard/opportunities?${params.toString()}`);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setFilter("status", s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              (status || "all") === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Lead
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Value
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Confidence
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {opportunities.map((opp) => {
              const statusClass =
                statusColors[opp.status?.toLowerCase()] ||
                "bg-gray-50 text-gray-600";

              return (
                <tr
                  key={opp.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/dashboard/opportunities/${opp.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {opp.leads?.lead_name || "—"}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                    €{(opp.value || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                    >
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {opp.confidence != null ? `${opp.confidence}%` : "—"}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-400">
                    {opp.date_created || "—"}
                  </td>
                </tr>
              );
            })}
            {opportunities.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-gray-400"
                >
                  No opportunities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {totalCount} opportunit{totalCount !== 1 ? "ies" : "y"} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
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
