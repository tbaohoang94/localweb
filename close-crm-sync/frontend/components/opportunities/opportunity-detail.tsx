import Link from "next/link";
import { ArrowLeft, Calendar, TrendingUp } from "lucide-react";

interface Opportunity {
  id: string;
  close_id: string;
  status: string;
  value: number;
  confidence: number | null;
  date_created: string;
  date_won: string | null;
  close_url: string | null;
  created_at: string;
  updated_at: string;
  lead_id: string;
}

interface Lead {
  id: string;
  lead_name: string;
}

interface Activity {
  id: string;
  calculation: string | null;
  ergebnis: string | null;
  date: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  won: "bg-blue-50 text-blue-700 border-blue-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export default function OpportunityDetail({
  opportunity,
  lead,
  activities,
}: {
  opportunity: Opportunity;
  lead: Lead | null;
  activities: Activity[];
}) {
  const statusClass =
    statusColors[opportunity.status?.toLowerCase()] ||
    "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <div>
      <Link
        href="/dashboard/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Opportunities
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500">
            {lead ? (
              <Link
                href={`/dashboard/leads/${lead.id}`}
                className="hover:text-blue-600"
              >
                {lead.lead_name}
              </Link>
            ) : (
              "Unknown Lead"
            )}
          </p>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">
            €{(opportunity.value || 0).toLocaleString()}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-400">
              Close ID: {opportunity.close_id}
            </p>
            {opportunity.close_url && (
              <a
                href={opportunity.close_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Open in Close
              </a>
            )}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}
        >
          {opportunity.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" />
            Details
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {opportunity.status || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Confidence</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {opportunity.confidence != null
                  ? `${opportunity.confidence}%`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Date Created</dt>
              <dd className="text-sm text-gray-900">
                {opportunity.date_created || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Date Won</dt>
              <dd className="text-sm text-gray-900">
                {opportunity.date_won || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            Related Activities ({activities.length})
          </h2>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400">No activities linked</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {act.calculation || "Activity"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {act.date
                        ? new Date(act.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-0.5 truncate">
                    {act.ergebnis || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
