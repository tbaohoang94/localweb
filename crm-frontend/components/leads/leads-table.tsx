"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Lead {
  id: string;
  close_id: string;
  lead_name: string;
  branche: string | null;
  leadscore: number | null;
  close_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function LeadsTable({
  leads,
  totalCount,
  page,
  search,
}: {
  leads: Lead[];
  totalCount: number;
  page: number;
  search: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);
  const pageSize = 25;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", searchInput);
    params.delete("page");
    router.push(`/dashboard/leads?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`/dashboard/leads?${params.toString()}`);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Lead
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Branche
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Leadscore
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-3">
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    {lead.lead_name || "Unnamed"}
                  </Link>
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  {lead.branche || "—"}
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  {lead.leadscore != null ? lead.leadscore : "—"}
                </td>
                <td className="px-6 py-3 text-sm text-gray-400">
                  {new Date(lead.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-sm text-gray-400"
                >
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {totalCount} lead{totalCount !== 1 ? "s" : ""} total
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
