"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, Video } from "lucide-react";

interface Transcript {
  id: string;
  lead_id: string | null;
  owner_id: string | null;
  transcript: string | null;
  activity_name: string | null;
  gespraechsdauer: number | null;
  talk_ratio: string | null;
  date: string | null;
  gespraechstyp: string | null;
  source: string | null;
  leads?: { lead_name: string } | null;
  close_users?: { name: string } | null;
}

const sourceLabels: Record<string, string> = {
  close_whisper: "Close (Whisper)",
  demodesk: "Demodesk",
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TranscriptsList({
  transcripts,
  totalCount,
  page,
  source,
}: {
  transcripts: Transcript[];
  totalCount: number;
  page: number;
  source: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSize = 25;
  const totalPages = Math.ceil(totalCount / pageSize);

  const navigate = (params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`/dashboard/transcripts?${sp.toString()}`);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {["all", "close_whisper", "demodesk"].map((s) => (
          <button
            key={s}
            onClick={() => navigate({ source: s === "all" ? "" : s, page: "" })}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              (source || "all") === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s === "all" ? "All" : sourceLabels[s] || s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Source
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Lead
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Duration
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Talk Ratio
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Owner
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {transcripts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-400"
                >
                  No transcripts found
                </td>
              </tr>
            ) : (
              transcripts.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {t.source === "demodesk" ? (
                        <Video size={14} className="text-purple-500" />
                      ) : (
                        <Phone size={14} className="text-blue-500" />
                      )}
                      <span className="text-xs text-gray-600">
                        {sourceLabels[t.source || ""] || t.source || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {t.leads?.lead_name && t.lead_id ? (
                      <Link
                        href={`/dashboard/leads/${t.lead_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {t.leads.lead_name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {t.gespraechstyp || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-600 tabular-nums">
                    {formatDuration(t.gespraechsdauer)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {t.talk_ratio || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {t.close_users?.name || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                    {t.date
                      ? new Date(t.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {totalCount} transcript{totalCount !== 1 ? "s" : ""} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ page: String(page - 1) })}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => navigate({ page: String(page + 1) })}
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
