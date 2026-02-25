import { createClient } from "@/lib/supabase-server";
import ActivityTimeline from "@/components/activities/activity-timeline";

export default async function ActivitiesPage() {
  const supabase = createClient();

  const { data, count } = await supabase
    .from("custom_activities")
    .select("*, leads(lead_name)", { count: "exact" })
    .order("date", { ascending: false })
    .limit(30);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Activities</h1>
        <p className="text-sm text-gray-500 mt-1">
          Custom activities synced from Close.io
        </p>
      </div>
      <ActivityTimeline
        initialActivities={data ?? []}
        initialCount={count ?? 0}
      />
    </div>
  );
}
