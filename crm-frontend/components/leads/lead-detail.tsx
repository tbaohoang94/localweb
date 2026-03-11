import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  BarChart3,
} from "lucide-react";

interface Opportunity {
  id: string;
  close_id: string;
  status: string;
  value: number;
  confidence: number | null;
  date_created: string;
}

interface Activity {
  id: string;
  calculation: string | null;
  ergebnis: string | null;
  date: string;
}

interface Lead {
  id: string;
  close_id: string;
  lead_name: string;
  close_url: string | null;
  branche: string | null;
  leadscore: number | null;
  setting_score: number | null;
  closing_score: number | null;
  coldcall_score: number | null;
  created_at: string;
  updated_at: string;
}

const oppStatusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  won: "bg-blue-50 text-blue-700",
  lost: "bg-red-50 text-red-700",
};

export default function LeadDetail({
  lead,
  opportunities,
  activities,
}: {
  lead: Lead;
  opportunities: Opportunity[];
  activities: Activity[];
}) {
  return (
    <div>
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Leads
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {lead.lead_name || "Unnamed Lead"}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-400">
              Close ID: {lead.close_id}
            </p>
            {lead.close_url && (
              <a
                href={lead.close_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Open in Close
              </a>
            )}
          </div>
        </div>
        {lead.branche && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {lead.branche}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scores */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-gray-400" />
            Scores
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Leadscore</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {lead.leadscore ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Setting Score</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {lead.setting_score ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Closing Score</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {lead.closing_score ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Coldcall Score</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {lead.coldcall_score ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Opportunities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-gray-400" />
            Opportunities ({opportunities.length})
          </h2>
          {opportunities.length === 0 ? (
            <p className="text-sm text-gray-400">No opportunities</p>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => {
                const statusClass =
                  oppStatusColors[opp.status?.toLowerCase()] ||
                  "bg-gray-50 text-gray-600";
                return (
                  <Link
                    key={opp.id}
                    href={`/dashboard/opportunities/${opp.id}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        €{(opp.value || 0).toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                      >
                        {opp.status}
                      </span>
                    </div>
                    {opp.confidence != null && (
                      <p className="text-xs text-gray-400 mt-1">
                        {opp.confidence}% confidence
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            Activities ({activities.length})
          </h2>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400">No activities</p>
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
