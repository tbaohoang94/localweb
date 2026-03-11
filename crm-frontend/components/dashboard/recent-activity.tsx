import { Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  calculation: string;
  ergebnis: string | null;
  date: string;
  lead_name?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecentActivity({
  activities,
}: {
  activities: ActivityItem[];
}) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <p className="text-sm text-gray-400">No recent activities</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="p-1.5 rounded-md text-gray-600 bg-gray-50">
              <Activity size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase">
                {item.calculation || "Activity"}
              </p>
              <p className="text-sm text-gray-900 truncate mt-0.5">
                {item.ergebnis || "—"}
              </p>
              {item.lead_name && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.lead_name}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatDate(item.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
